// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ElementRef, Injectable } from '@angular/core';
import { ConsoleService } from './console.service';
import NoVncClient from '@novnc/novnc/core/rfb';
import { ConsoleOptions, ConsoleSupportsFeatures } from '../console.models';

@Injectable()
export class NoVNCConsoleService implements ConsoleService {
  private client!: NoVncClient;
  private options?: ConsoleOptions;

  connect(
    url: string,
    stateCallback: (state: string) => void,
    options: ConsoleOptions
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

  disconnect(): void { }

  getClipboardHelpMarkdown(): string {
    return `
      COPY transfers the vm clip to _your_ clipboard. Select/Copy text in the vm using **CTRL-C** or context menu
      before clicking COPY here. (Clicking COPY shows text below _AND_ adds to your clipboard.)

PASTE copies the text below to the console's clipboard.
    `.trim()
  }

  getSupportedFeatures(): ConsoleSupportsFeatures {
    return {
      syncResolution: false,
      virtualKeyboard: false
    }
  }

  sendCAD(): void {
    this.client.sendCtrlAltDel();
  }

  copy(): void { }

  async paste(text: string): Promise<void> {
    console.log(text);
    this.client.clipboardPasteFrom(text);
  }

  refresh(): void { }

  toggleScale(): void {
    this.client.scaleViewport = !this.client.scaleViewport;
  }

  async fullscreen(consoleHostRef?: ElementRef): Promise<void> {
    const typedHost = consoleHostRef?.nativeElement as HTMLElement;
    if (!typedHost) {
      throw new Error("Couldn't resolve the canvas element to enable fullscreen support.");
    }

    await typedHost.requestFullscreen({ navigationUI: 'hide' });
  }

  showKeyboard(): void {

  }

  showExtKeypad(): void { }
  showTrackpad(): void { }
  stateChanged!: (state: string) => void;

  dispose(): void { }
}
