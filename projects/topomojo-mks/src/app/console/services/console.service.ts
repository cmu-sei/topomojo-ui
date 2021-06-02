// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.


export interface ConsoleService {
  connect(url: string, stateCallback: (state: string) => void, options: any): void;
  disconnect(): void;
  refresh(): void;
  resolve(): void;
  sendCAD(): void;
  toggleScale(): void;
  fullscreen(): void;
  showKeyboard(): void;
  showExtKeypad(): void;
  showTrackpad(): void;
  copy(): void;
  paste(text: string): void;
  dispose(): void;
}
