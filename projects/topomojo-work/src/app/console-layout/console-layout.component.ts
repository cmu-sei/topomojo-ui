import { Component, computed, DestroyRef, effect, inject, signal, viewChild } from '@angular/core';
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
  private readonly consoleSummary = signal<ConsoleSummary | undefined>(undefined);
  private readonly connectionStatus = signal<ConsoleConnectionStatus | undefined>(undefined);
  private pollSub?: Subscription;
  private pollRequest?: ConsoleRequest;

  // isRunning is authoritative: Proxmox hands out a vncproxy ticket even for a stopped VM, so a
  // non-empty console URL does not imply the machine is powered on. A live console connection does,
  // and it outranks isRunning, which trails the hypervisor cache by up to 30s.
  protected vmPowerState = computed<ConsoleVmPowerState>(() => {
    if (this.connectionStatus() === "connected") {
      return "on";
    }

    const summary = this.consoleSummary();
    if (!summary) {
      return "unknown";
    }

    if (summary.isRunning === false) {
      return "off";
    }

    return summary.url ? "on" : "unknown";
  });

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

    // Poll until the console is actually connected. That covers a power-off under a live console
    // (isRunning refreshes and the overlay appears), an out-of-band power-on, and the reconnect
    // after our own power-on: each poll republishes a fresh ticket, which the effect above connects.
    effect(() => {
      const request = this.consoleRequest();

      if (!request || this.connectionStatus() === "connected") {
        this.stopPolling();
      } else {
        this.startPolling(request);
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
    // the polling effect owns the poll subscription; clear the state it derives from so a new
    // request re-evaluates power state from scratch
    this.consoleSummary.set(undefined);
    this.connectionStatus.set(undefined);
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
    this.consoleSummary.set(consoleSummary);

    // Proxmox mints a fresh vncticket on every poll, even for a stopped machine. Connecting those
    // just fails, so a powered-off VM publishes an empty URL: cf-console still renders (which is
    // what hosts the power overlay) and the first poll that reports running triggers the connect.
    const isOff = consoleSummary.isRunning === false;
    const url = isOff ? "" : consoleSummary.url;
    const accessTicket = isOff ? undefined : consoleSummary.ticket;

    const current = this.consoleConfig();
    if (!current || current.url !== url || current.credentials?.accessTicket !== accessTicket) {
      this.consoleConfig.set({
        autoFocusOnConnect: true,
        // Topo's API returns a non-null ticket value for proxmox/VNC consoles
        consoleClientType: (consoleSummary.ticket !== null ? "vnc" : "vmware") as ConsoleClientType,
        credentials: { accessTicket },
        url,
      });
    }
  }

  private startPolling(request: ConsoleRequest) {
    if (this.pollSub && this.pollRequest === request) {
      return;
    }

    this.stopPolling();
    this.pollRequest = request;

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
    this.pollRequest = undefined;
  }

  protected handleConnectionStatusChanged(status?: ConsoleConnectionStatus) {
    this.connectionStatus.set(status);
  }

  protected handlePowerOnRequested() {
    if (!this.topoVmId) {
      return;
    }

    this.api.power({ id: this.topoVmId, type: VmOperationTypeEnum.start }).pipe(
      catchError(err => { this.errors.push(err); return of(undefined); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }
}
