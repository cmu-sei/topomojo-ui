// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel, HubConnectionState, IHttpConnectionOptions } from '@microsoft/signalr';
import { BehaviorSubject, Subject, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { ConfigService } from './config.service';
import { AuthService, AuthTokenState } from './auth.service';
import { ProfileService } from './api/profile.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private connection: HubConnection;
  private hubState: HubState = { id: '', connected: false, joined: false, actors: []};

  state$ = new BehaviorSubject<HubState>(this.hubState);
  globalEvents = new Subject<HubEvent>();
  presenceEvents = new Subject<HubEvent>();
  topoEvents = new Subject<HubEvent>();
  vmEvents = new Subject<HubEvent>();
  templateEvents = new Subject<HubEvent>();
  documentEvents = new Subject<HubEvent>();
  me = '';

  constructor(
    config: ConfigService,
    auth: AuthService,
    private profileSvc: ProfileService
  ) {

    this.connection = this.getConnection(`${config.apihost}hub`);

    // refresh connection on token refresh
    auth.tokenState$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
    ).subscribe(token => {
      if (token === AuthTokenState.valid) {
        this.me = auth.oidcUser?.profile.sub || '';
        this.disconnect().then(
          () => this.connect()
        );
      }
      if (token === AuthTokenState.invalid || token === AuthTokenState.expired) {
        this.disconnect();
      }
    });

  }

  async joinWorkspace(id: string): Promise<void> {

    // prevent race if trying to join channel before connection is fully up
    if (this.connection.state !== HubConnectionState.Connected) {
      timer(1000).subscribe(() => this.joinWorkspace(id));
      return;
    }

    try {
      await this.leaveWorkspace();
      if (!!id) {
        await this.connection.invoke('Listen', id);
        this.hubState.id = id;
        this.hubState.joined = true;
        this.postState();
      }
    } catch (e) {
      console.log(e);
    }
  }

  async leaveWorkspace(): Promise<void> {
    if (!!this.hubState.id && this.connection.state === HubConnectionState.Connected) {
      await this.connection.invoke('Leave', this.hubState.id);
      this.hubState.id = '';
      this.hubState.joined = false;
      this.hubState.actors = [];
      this.postState();
    }
  }

  private getConnection(url: string): HubConnection {

    const connection = new HubConnectionBuilder()
      .withUrl(url, {
        accessTokenFactory: () => this.getTicket(),
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      } as IHttpConnectionOptions)
      .withAutomaticReconnect([1000, 2000, 3000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000])
      .configureLogging(LogLevel.Information)
      .build();

    connection.onclose(err => this.setDiconnected());
    connection.onreconnecting(err => this.setDiconnected());
    connection.onreconnected(cid => this.setConnected());

    connection.on('presenceEvent', (event: HubEvent) => {
      if (event.action === 'PRESENCE.ARRIVED') {
          connection.invoke('Greet', this.hubState.id);
      }
      this.presenceEvents.next(event);
      this.updatePresence(event);
    });

    connection.on('DocumentEvent', (e: HubEvent) => {
      if (e.action === 'DOCUMENT.UPDATED') { this.setActorEditing(e, true); }
      if (e.action === 'DOCUMENT.IDLE') { this.setActorEditing(e, false); }
      this.documentEvents.next(e);
    });

    connection.on('topoEvent', (e: HubEvent) => this.topoEvents.next(e));
    connection.on('vmEvent', (e: HubEvent) => this.vmEvents.next(e));
    connection.on('templateEvent', (e: HubEvent) => this.templateEvents.next(e));
    connection.on('globalEvent', (e: HubEvent) => this.globalEvents.next(e));

    return connection;
  }

  private async getTicket(): Promise<string> {
    return this.profileSvc.ticket().pipe(
      map(result => result.ticket)
    ).toPromise();
  }

  private async connect(): Promise<void> {
    try {
      await this.connection.start();
      await this.setConnected();
    } catch (e) {
      timer(5000).subscribe(() => this.connect());
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.connection?.state === HubConnectionState.Connected) {
        await this.connection.stop();
        this.setDiconnected();
      }
    } finally {}
  }

  private async setConnected(): Promise<void> {
    this.hubState.connected = true;
    this.postState();
    if (this.hubState.id){
      await this.joinWorkspace(this.hubState.id); // rejoin if was previously joined
    }
  }

  private setDiconnected(): void {
    this.hubState.connected = false;
    this.hubState.joined = false;
    this.hubState.actors = [];
    this.postState();
  }

  private updatePresence(event: HubEvent): void {
    event.actor.online = (event.action === 'PRESENCE.ARRIVED' || event.action === 'PRESENCE.GREETED');
    const actor = this.hubState.actors.find(a => a.id === event.actor.id);
    if (actor) {
        actor.online = event.actor.online;
    } else {
        this.hubState.actors.push(event.actor);
    }
    this.postState();
  }

  private setActorEditing(event: HubEvent, val: boolean): void {
    const actor = this.hubState.actors.find(a => a.id === event.actor.id) || {} as Actor;
    if (actor.editing !== val) {
        actor.editing = val;
        this.postState();
    }
  }

  private postState(): void {
    this.state$.next(this.hubState);
  }

  cursorChanged(lines: any): void {
    this.connection.invoke('CursorChanged', this.hubState.id, lines);
  }

  edited(changes: any): void {
    this.connection.invoke('Edited', this.hubState.id, changes);
  }

}

export interface HubState {
  id: string;
  connected: boolean;
  joined: boolean;
  actors: Actor[];
}

export interface HubEvent {
  action: string;
  actor: Actor;
  model?: any;
}

export interface Actor {
  id: string;
  name: string;
  online?: boolean;
  typing?: boolean;
  editing?: boolean;
}
