// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { Subject, timer } from 'rxjs';
import { ConsolePresence, ConsoleRequest } from './api.models';

@Injectable({
  providedIn: 'root'
})
export class HubService {

  peers$ = new Subject<ConsolePresence[]>();
  audience = this.peers$.asObservable();
  private peers: ConsolePresence[] = [];
  private console!: ConsoleRequest;
  private hub = '';
  private connection!: HubConnection;

  constructor() {
    this.hub = environment.hubUrl || '/hub/session';
  }

  init(console: ConsoleRequest): void {
    this.console = console;
    this.buildConnection().then(
      () => this.connect()
    );
  }

  focus(): void {
    if (this.connection?.state === HubConnectionState.Connected) {
      this.connection.invoke('focusConsole', this.console);
    }
  }

  blur(): void {
    if (this.connection?.state === HubConnectionState.Connected) {
      this.connection.invoke('focusConsole', { sessionId: this.console.sessionId });
    }
  }

  private buildConnection(): Promise<void> {

    return this.disconnect().finally(() => {

      this.connection = new HubConnectionBuilder()
        .withUrl(this.hub, {
          // accessTokenFactory: () => this.getTicket(),
          transport: HttpTransportType.WebSockets,
          skipNegotiation: true
        })
        .configureLogging(LogLevel.Information)
        .build();

      this.connection.onclose(
        err => {
          console.log(err);
          if (err) {
            timer(2000).subscribe(() => this.connect());
          }
        }
      );

      this.connection.on('ConsoleFocused',
        (console: ConsoleRequest) => this.setPresence(console, true)
      );

      this.connection.on('ConsoleAcked',
        (console: ConsolePresence) => this.setPresence(console, false)
      );
    });
  }

  private connect(): void {

    this.connection.start()
      .then(() => this.focus())
      .catch(() => {
        timer(2000).subscribe(() => this.connect());
      });
  }

  private disconnect(): Promise<void> {
    return this.connection
      ? this.connection.stop()
      : Promise.resolve();
  }

  // add or remove from party
  private setPresence(console: ConsolePresence, joined: boolean): void {

    const found = this.peers.findIndex(c => c.username === console.username);

    if (
      console.sessionId === this.console.sessionId &&
      console.name === this.console.name
    ) {
      // add if not present
      if (found < 0) {
        this.peers.push(console);
      }

      // acknowledge new party member
      if (joined) {
        this.connection.invoke('ackConsole', console);
      }

    } else {

      // remove if present
      if (found >= 0) {
        this.peers.splice(found, 1);
      }

    }

    this.peers$.next(this.peers);

  }

}
