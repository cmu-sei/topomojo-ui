import { Component, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { catchError, first, firstValueFrom, forkJoin, interval, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { ConsoleClientType, ConsoleComponent, ConsoleComponentConfig, ConsoleComponentNetworkConfig, ConsoleConnectionStatus, ConsoleNetworkConnectionRequest, ConsoleNetworkDisconnectionRequest, ConsoleVmPowerState } from '@cmusei/console-forge';
import { ConsoleRequest, ConsoleSummary, VmOperationTypeEnum } from '../consoles-api.models';
import { ConsolesApiService } from '../consoles-api.service';

@Component({
  selector: 'app-console-layout',
  standalone: false,
  templateUrl: './console-layout.component.html',
  styleUrl: './console-layout.component.scss'
})
export class ConsoleLayoutComponent {
  private readonly api = inject(ConsolesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  private consoleRequest = toSignal(this.route.queryParams.pipe(map(p => ({
    name: p.name,
    sessionId: p.sessionId,
    token: p.token,
  }))));

  protected consoleComponent = viewChild(ConsoleComponent);
  protected consoleConfig = signal<ConsoleComponentConfig | undefined>(undefined);
  protected consoleNetworkConfig = signal<ConsoleComponentNetworkConfig | undefined>(undefined);
  protected errors: any[] = [];

  // assume three nics, like topo classic
  private readonly availableNics = ["NIC1", "NIC2", "NIC3"];
  private topoVmId = "";
  private readonly pollIntervalMs = 5000;
  protected vmPowerState = signal<ConsoleVmPowerState>("unknown");
  private pollSub?: Subscription;

  constructor() {
    effect(() => {
      // run on console request (from query params) change
      const request = this.consoleRequest();
      this.loadConsoleData(request);
    });

    // whenever the console config is updated, auto connect
    effect(() => {
      const consoleConfig = this.consoleConfig();
      const component = this.consoleComponent();

      if (consoleConfig?.url && component) {
        component.connect(consoleConfig);
      }
    });
  }

  protected async handleNetworkConnectRequest(request: ConsoleNetworkConnectionRequest) {
    try {
      // this does return a response, but it doesn't report anything about the network config or current net, so we don't use it
      // topo's API wants us to give it a network name, a colon, and then an index to tell it which NIC to target (the machine could have multiple)
      await firstValueFrom(this.api.update(this.topoVmId, { key: "net", value: `${request.network}:${this.availableNics.indexOf(request.nic)}` }));

      this.consoleNetworkConfig.update(config => {
        const currentConnections = config!.currentConnections;
        currentConnections[request.nic] = request.network;
        return config;
      });
    }
    catch (err) {
      this.consoleNetworkConfig.update(config => {
        if (config?.currentConnections?.[request.nic]) {
          delete config.currentConnections[request.nic];
        }
        return config;
      });
    }
  }

  protected async handleNetworkDisconnectRequest(request?: ConsoleNetworkDisconnectionRequest) {
    // if a NIC is passed, disconnect it, otherwise, disconnect all
    if (request?.nic) {
      await firstValueFrom(this.api.update(this.topoVmId, { key: "net", value: "" }));
    } else {
      const disconnectionTasks: Observable<any>[] = [];
      const currentConnections = this.consoleNetworkConfig()?.currentConnections;

      for (const connectedNic in currentConnections) {
        if (connectedNic && currentConnections[connectedNic]) {
          disconnectionTasks.push(this.api.update(this.topoVmId, { key: "net", value: `:${this.availableNics.indexOf(connectedNic)}` }));
        }
      }

      if (disconnectionTasks.length) {
        forkJoin(disconnectionTasks).pipe(first()).subscribe();
      }
    }
  }

  protected handleReconnectRequest() {
    this.loadConsoleData(this.consoleRequest());
  }

  private async loadConsoleData(request?: ConsoleRequest) {
    this.stopPolling();
    this.errors = [];
    if (!request) {
      this.consoleNetworkConfig.update(() => undefined);
      return;
    }

    try {
      // A ticket is only present for direct console handoffs. LP already establishes
      // the cookie session before opening its console URL.
      if (request.token) {
        await firstValueFrom(this.api.redeem(request.token));
      }

      this.api.ticket(request).subscribe({
        next: consoleSummary => {
          this.applyConsoleSummary(consoleSummary);
          if (request.name) {
            this.title.setTitle(`console: ${request.name}`);
          }
        },
        error: err => this.errors.push(err)
      });

      this.api.nets(request.sessionId || "").pipe(
        catchError(() => of(undefined))
      ).subscribe(vmOptions => {
        if (!vmOptions) {
          return;
        }

        this.consoleNetworkConfig.update(() => ({
          networks: vmOptions.net.sort(),
          nics: this.availableNics,
          currentConnections: {}
        }));
      });
    }
    catch (err) {
      this.errors.push(err);
    }
  }

  private applyConsoleSummary(consoleSummary: ConsoleSummary) {
    this.topoVmId = consoleSummary.id;

    // The API only returns a console URL when the hypervisor granted a ticket, which requires a
    // powered-on VM. That's a fresher signal than isRunning, which trails the hypervisor cache
    // (refreshed every 30s server-side).
    const isConnectable = !!consoleSummary.url;
    this.vmPowerState.set(isConnectable ? "on" : (consoleSummary.isRunning ? "unknown" : "off"));

    const current = this.consoleConfig();
    if (!current || current.url !== consoleSummary.url || current.credentials?.accessTicket !== consoleSummary.ticket) {
      this.consoleConfig.set({
        autoFocusOnConnect: true,
        // Topo's API returns a non-null ticket value for proxmox/VNC consoles
        consoleClientType: (consoleSummary.ticket !== null ? "vnc" : "vmware") as ConsoleClientType,
        credentials: { accessTicket: consoleSummary.ticket },
        url: consoleSummary.url,
      });
    }

    if (isConnectable) {
      this.stopPolling();
    } else {
      this.startPolling();
    }
  }

  private startPolling() {
    if (this.pollSub) {
      return;
    }

    const request = this.consoleRequest();
    if (!request) {
      return;
    }

    this.pollSub = interval(this.pollIntervalMs).pipe(
      switchMap(() => this.api.ticket(request).pipe(catchError(() => of(undefined)))),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(consoleSummary => {
      if (consoleSummary) {
        this.applyConsoleSummary(consoleSummary);
      }
    });
  }

  private stopPolling() {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  protected handleConnectionStatusChanged(status?: ConsoleConnectionStatus) {
    // covers a VM powered off out from under a live console: poll decides whether this is a
    // power-off (show the power overlay) or a transient disconnect (Forge's banner stays)
    if (status === "disconnected") {
      this.startPolling();
    }
  }

  protected handlePowerOnRequested() {
    if (!this.topoVmId) {
      return;
    }

    this.api.power({ id: this.topoVmId, type: VmOperationTypeEnum.start }).pipe(
      catchError(err => { this.errors.push(err); return of(undefined); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.startPolling());
  }
}
