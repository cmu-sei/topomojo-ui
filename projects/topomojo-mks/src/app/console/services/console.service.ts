// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ElementRef } from "@angular/core";
import { Observable } from "rxjs";
import { ConsoleOptions, ConsoleSupportsFeatures } from "../console.models";

export interface ConsoleService {
  clipboardHelpText$: Observable<string>;

  connect(url: string, stateCallback: (state: string) => void, options: ConsoleOptions): void;
  disconnect(): void;
  refresh(): void;
  sendCAD(): void;
  toggleScale(): void;
  fullscreen(consoleHostRef?: ElementRef): void;
  getSupportedFeatures(): ConsoleSupportsFeatures;
  setAutoCopyVmSelection(enabled: boolean): void;
  showKeyboard(): void;
  showExtKeypad(): void;
  showTrackpad(): void;
  copy(): void;
  paste(text: string): void;
  dispose(): void;
}
