import { Component, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { first, firstValueFrom, forkJoin, map, Observable } from 'rxjs';
import { ConsoleClientType, ConsoleComponent, ConsoleComponentConfig, ConsoleComponentNetworkConfig, ConsoleNetworkConnectionRequest, ConsoleNetworkDisconnectionRequest } from '@cmusei/console-forge';
import { ConsoleRequest, ConsoleSummary } from '../consoles-api.models';
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

      if (consoleConfig && component) {
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
    this.errors = [];

    if (!request) {
      this.consoleNetworkConfig.update(() => undefined);
      return;
    }

    try {
      // ensure logged in
      // TODO: does this token even matter? previous implementation was looking for this in the querystring and not finding it, I don't think
      await firstValueFrom(this.api.redeem(""));

      forkJoin([
        this.api.nets(request.sessionId || ""),
        this.api.ticket(request)
      ]).subscribe(results => {
        // update available networks
        const vmOptions = results[0];
        this.consoleNetworkConfig.update(() => ({
          networks: vmOptions.net.sort(),
          nics: this.availableNics,
          currentConnections: {}
        }));

        // and the console config
        this.connectConsole(results[1]);

        // then miscellany like the page title
        if (request.name) {
          this.title.setTitle(`console: ${request.name}`);
        }
      });
    }
    catch (err) {
      this.errors.push(err);
    }
  }

  private connectConsole(consoleSummary: ConsoleSummary) {
    // Topo's API returns a non-null ticket value for proxmox/VNC consoles
    const consoleClientType: ConsoleClientType = consoleSummary.ticket !== null ? "vnc" : "vmware";
    this.topoVmId = consoleSummary.id;
    this.consoleConfig.update(() => ({
      autoFocusOnConnect: true,
      consoleClientType,
      credentials: {
        accessTicket: consoleSummary.ticket
      },
      url: consoleSummary.url,
    }));
  }
}
