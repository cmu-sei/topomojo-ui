// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { ConsoleService } from './console.service';
import NoVncClient from '@novnc/novnc/core/rfb';

@Injectable()
export class NoVNCConsoleService implements ConsoleService {
  private client!: NoVncClient;
  options: any = {
    rescale: true,
    changeResolution: false,
    useVNCHandshake: false,
    position: 0, // WMKS.CONST.Position.CENTER,
  };
  stateChanged!: (state: string) => void;

  constructor() {}

  connect(
    url: string,
    stateCallback: (state: string) => void,
    options: any = {}
  ): void {
    if (stateCallback) {
      this.stateChanged = stateCallback;
    }
    this.options = { ...this.options, ...options };

    this.client = new NoVncClient(
      document.getElementById(this.options.canvasId)!,
      url,
      {
        credentials: {
          password: this.options.ticket,
          target: '',
          username: '',
        },
      }
    );

    this.client.viewOnly = this.options.viewOnly;
    this.client.scaleViewport = true;

    this.client.addEventListener('connect', () => {
      stateCallback('connected');
    });

    this.client.addEventListener('disconnect', () => {
      stateCallback('disconnected');
    });

    this.client.addEventListener('clipboard', (e) => {
      stateCallback('clip:' + e.detail.text);
    });
  }

  disconnect(): void {}

  sendCAD(): void {
    this.client.sendCtrlAltDel();
  }

  copy(): void {}

  async paste(text: string): Promise<void> {
    console.log(text);
    this.client.clipboardPasteFrom(text);
  }

  refresh(): void {}

  toggleScale(): void {
    // if (this.wmks) {
    //   this.options.rescale = !this.options.rescale;
    //   this.wmks.setOption('rescale', this.options.rescale);
    // }
  }

  // NOTE: can't seem to set `changeResolution` dynamically
  // Tried to set up a button to go fullbleed, but doesn't
  // work if changeResolution is false initially
  resolve(): void {}

  fullscreen(): void {}

  showKeyboard(): void {}

  showExtKeypad(): void {}

  showTrackpad(): void {}

  dispose(): void {}
}
