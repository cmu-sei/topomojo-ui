import { Component, computed, DestroyRef, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { catchError, distinctUntilChanged, exhaustMap, filter, first, firstValueFrom, forkJoin, map, Observable, of, Subscription, switchMap, timeout, timer } from 'rxjs';
import { ConsoleComponent, ConsoleComponentConfig, ConsoleComponentNetworkConfig, ConsoleConnectionStatus, ConsoleNetworkConnectionRequest, ConsoleNetworkDisconnectionRequest, ConsoleVmActivity, ConsoleVmPowerState } from '@cmusei/console-forge';
import { ConsoleRequest, ConsoleSummary, VmOperationTypeEnum, VmStateEnum } from '../consoles-api.models';
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

  private consoleRequest?: ConsoleRequest;
  protected consoleComponent = viewChild(ConsoleComponent);
  protected consoleConfig = signal<ConsoleComponentConfig | undefined>(undefined);
  protected consoleNetworkConfig = signal<ConsoleComponentNetworkConfig | undefined>(undefined);
  protected errors: any[] = [];

  // assume three nics, like topo classic
  private readonly availableNics = ["NIC1", "NIC2", "NIC3"];
  private get topoVmId(): string { return this.consoleSummary()?.id ?? ""; }
  private readonly pollIntervalMs = 5000;
  private readonly consoleSummary = signal<ConsoleSummary | undefined>(undefined);
  private readonly connectionStatus = signal<ConsoleConnectionStatus | undefined>(undefined);
  private readonly startPending = signal(false);
  private readonly stateUnavailable = signal(false);
  private readonly authorizationFailed = signal(false);
  private sessionSub = new Subscription();
  private generation = 0;
  protected readonly consoleSessions = signal<number[]>([]);
  private connectAttempt = 0;
  private connectTimeout?: ReturnType<typeof setTimeout>;
  private readonly redeemedTokens = new Set<string>();

  protected readonly vmActivity = computed<ConsoleVmActivity | undefined>(() => {
    if (this.stateUnavailable() || this.authorizationFailed())
      return { kind: "unknown", status: "active" };
    const activity = this.consoleSummary()?.activity;
    if (activity) return activity;
    return this.startPending() ? { kind: "starting", status: "active" } : undefined;
  });

  // isRunning is authoritative: Proxmox hands out a vncproxy ticket even for a stopped VM, so a
  // non-empty console URL does not imply the machine is powered on. A live console connection does,
  // and it outranks isRunning, which trails the hypervisor cache by up to 30s.
  protected vmPowerState = computed<ConsoleVmPowerState>(() => {
    if (this.connectionStatus() === "connected") {
      return "on";
    }

    const summary = this.consoleSummary();
    if (!summary?.id || this.stateUnavailable() || this.authorizationFailed()) {
      return "unknown";
    }

    if ("state" in summary) {
      switch (summary.state) {
        case VmStateEnum.running: return "on";
        case VmStateEnum.off: return "off";
        case VmStateEnum.suspended: return "suspended";
        default: return "unknown";
      }
    }
    if (summary.isRunning === false) {
      return "off";
    }

    return summary.isRunning === true ? "on" : "unknown";
  });

  constructor() {
    this.route.queryParams.pipe(
      map(p => ({ name: p.name, sessionId: p.sessionId, token: p.token })),
      distinctUntilChanged((a, b) => a.name === b.name && a.sessionId === b.sessionId && a.token === b.token),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(request => this.loadConsoleData(request));

    // whenever the console config is updated, auto connect
    effect(() => {
      const consoleConfig = this.consoleConfig();
      const component = this.consoleComponent();

      untracked(() => {
        if (consoleConfig?.url && component && this.connectTimeout === undefined &&
            this.connectionStatus() !== "connected" && !this.authorizationFailed()) {
          this.connectConsole(component, consoleConfig);
        }
      });
    });

    this.destroyRef.onDestroy(() => {
      ++this.generation;
      this.sessionSub.unsubscribe();
      this.cancelConnectionAttempt();
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

  protected async handleReconnectRequest() {
    const request = this.consoleRequest;
    const generation = this.generation;
    await this.consoleComponent()?.disconnect();
    if (generation !== this.generation) return;
    this.connectionStatus.set("disconnected");
    this.loadConsoleData(request, true);
  }

  private loadConsoleData(request?: ConsoleRequest, preserveConsole = false) {
    this.sessionSub.unsubscribe();
    this.sessionSub = new Subscription();
    const generation = preserveConsole ? this.generation : ++this.generation;
    this.cancelConnectionAttempt();
    this.consoleRequest = request;
    if (!preserveConsole) {
      this.consoleConfig.set(undefined);
      this.consoleNetworkConfig.set(undefined);
      this.consoleSessions.set([]);
      this.consoleSummary.set(undefined);
      this.connectionStatus.set(undefined);
      this.startPending.set(false);
    }
    this.stateUnavailable.set(false);
    this.authorizationFailed.set(false);
    this.errors = [];
    if (!request?.name || !request.sessionId) {
      this.errors = [new Error("The console URL must include a VM name and session ID.")];
      return;
    }

    const authentication = request.token && !this.redeemedTokens.has(request.token)
      ? this.api.redeem(request.token) : of(undefined);
    this.sessionSub.add(authentication.pipe(
      timeout(30000),
      switchMap(() => {
        if (request.token) this.redeemedTokens.add(request.token);
        this.sessionSub.add(this.api.nets(request.sessionId!).pipe(
          timeout(15000), catchError(() => of(undefined))
        ).subscribe(options => {
          if (options && generation === this.generation)
            this.consoleNetworkConfig.set({ networks: options.net.sort(), nics: this.availableNics, currentConnections: {} });
        }));
        return timer(0, this.pollIntervalMs).pipe(
          filter(() => this.connectionStatus() !== "connected" && !this.authorizationFailed()),
          exhaustMap(() => this.api.ticket(request).pipe(
            timeout(15000),
            catchError(err => {
              if (generation === this.generation) this.handleRequestError(err);
              return of(undefined);
            })
          ))
        );
      })
    ).subscribe({
      next: summary => {
        if (summary && generation === this.generation) {
          this.applyConsoleSummary(summary);
          this.title.setTitle(`console: ${request.name}`);
          this.consoleSessions.set([generation]);
        }
      },
      error: err => {
        if (generation === this.generation) this.handleRequestError(err);
      }
    }));
  }

  private applyConsoleSummary(consoleSummary: ConsoleSummary) {
    this.stateUnavailable.set(false);
    this.consoleSummary.set(consoleSummary);
    if (consoleSummary.state === VmStateEnum.running || consoleSummary.isRunning ||
        consoleSummary.activity?.status === "failed")
      this.startPending.set(false);
    if (consoleSummary.error) this.errors = [new Error(consoleSummary.error)];
    if (!consoleSummary.id) this.stateUnavailable.set(true);
    const connectable = this.vmPowerState() === "on" && this.vmActivity()?.status !== "active";
    // Republish even unchanged tickets so a failed connection can retry on the next poll.
    // The connection coordinator prevents this from interrupting a handshake.
    this.consoleConfig.set({
      autoFocusOnConnect: true,
      consoleClientType: consoleSummary.ticket != null ? "vnc" : "vmware",
      credentials: { accessTicket: connectable ? consoleSummary.ticket ?? undefined : undefined },
      url: connectable ? consoleSummary.url || "" : ""
    });
  }

  protected handleConnectionStatusChanged(status?: ConsoleConnectionStatus, generation = this.generation) {
    if (generation !== this.generation) return;
    this.connectionStatus.set(status);
    if (status === "connected") {
      this.startPending.set(false);
      this.cancelConnectionAttempt();
      this.errors = [];
    } else if (status === "disconnected") {
      this.cancelConnectionAttempt();
    }
  }

  protected handlePowerOnRequested() {
    if (!this.topoVmId || this.vmPowerState() !== "off" || this.startPending() ||
        this.vmActivity()?.status === "active" || this.authorizationFailed()) return;

    const generation = this.generation;
    this.startPending.set(true);
    this.errors = [];
    this.sessionSub.add(this.api.power({ id: this.topoVmId, type: VmOperationTypeEnum.start }).pipe(
      timeout(30000)
    ).subscribe({
      error: err => {
        if (generation !== this.generation) return;
        this.startPending.set(false);
        this.handleRequestError(err);
      }
    }));
  }

  protected handleConnectFailed(error: Error, generation = this.generation) {
    if (generation !== this.generation) return;
    this.errors = [error];
    this.connectionStatus.set("disconnected");
    this.cancelConnectionAttempt();
  }

  private handleRequestError(error: any) {
    this.errors = [error];
    this.stateUnavailable.set(true);
    if (error?.status === 401 || error?.status === 403) this.authorizationFailed.set(true);
  }

  private connectConsole(component: ConsoleComponent, config: ConsoleComponentConfig) {
    const generation = this.generation;
    const attempt = ++this.connectAttempt;
    this.connectTimeout = setTimeout(() => {
      if (generation !== this.generation || attempt !== this.connectAttempt) return;
      this.handleConnectFailed(new Error("The console connection timed out. Retrying."), generation);
      void component.disconnect().catch(() => {});
    }, 30000);
    void component.connect(config).catch(err => {
      if (attempt === this.connectAttempt) this.handleConnectFailed(err, generation);
    });
  }

  private cancelConnectionAttempt() {
    ++this.connectAttempt;
    clearTimeout(this.connectTimeout);
    this.connectTimeout = undefined;
  }
}
