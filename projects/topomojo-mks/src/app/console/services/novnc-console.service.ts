// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ElementRef, Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ConsoleService } from './console.service';
import NoVncClient from '@novnc/novnc/core/rfb';
import { ConsoleOptions, ConsoleSupportsFeatures } from '../console.models';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class NoVNCConsoleService implements ConsoleService {
  private client!: NoVncClient;
  private clipboardHelpTextSubject$ = new BehaviorSubject<string>("");
  private consoleClipboardText = "";
  private enableAutoCopy = true;
  private options?: ConsoleOptions;

  clipboardHelpText$ = this.clipboardHelpTextSubject$.asObservable();

  constructor(@Inject(DOCUMENT) private document: Document) {
    // enable auto-copy by default
    this.setAutoCopyVmSelection(true);
  }

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

    this.client.resizeSession = this.options.changeResolution;
    this.client.scaleViewport = true;
    this.client.viewOnly = this.options.viewOnly;

    this.client.addEventListener("clipboard", clipboardEv => {
      this.consoleClipboardText = clipboardEv.detail.text;

      if (this.stateChanged && this.enableAutoCopy) {
        this.stateChanged('clip:' + this.consoleClipboardText);
      }
    });

    this.client.addEventListener('connect', () => {
      stateCallback('connected');
    });

    this.client.addEventListener('disconnect', () => {
      stateCallback('disconnected');
    });
  }

  disconnect(): void { }

  getSupportedFeatures(): ConsoleSupportsFeatures {
    return {
      autoCopyVmSelection: true,
      virtualKeyboard: false
    }
  }

  sendCAD(): void {
    this.client.sendCtrlAltDel();
  }

  setAutoCopyVmSelection(enabled: boolean): void {
    this.enableAutoCopy = enabled;

    let clipboardHelp = "**PASTE** copies the text below to the virtual console's clipboard.";

    if (!this.enableAutoCopy) {
      clipboardHelp = `**Copy** places the text content of the virtual console's clipboard to your local clipboard.\n\n${clipboardHelp}`
    }

    this.clipboardHelpTextSubject$.next(clipboardHelp);
  }

  copy(): void {
    if (!this.document.defaultView?.navigator) {
      throw new Error("Can't access the navigator for clipboard access.");
    }

    this
      .document
      .defaultView
      .navigator
      .clipboard
      .writeText(this.consoleClipboardText);

    this.stateChanged(`clip:${this.consoleClipboardText}`);
  }

  async paste(text: string): Promise<void> {
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
    // no-op (not supported on novnc)
  }

  showExtKeypad(): void { }
  showTrackpad(): void { }
  stateChanged!: (state: string) => void;

  dispose(): void { }
}
