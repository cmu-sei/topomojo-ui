import { Injectable } from '@angular/core';
import { ConsoleService } from './console.service';

@Injectable()
export class MockConsoleService implements ConsoleService {
  counter = 0;
  stateChanged!: (state: string) => void;

  constructor() { }

  connect(url: string, stateCallback: (state: string) => void, options: any): void {
    let s = '';
    if (stateCallback === Function) { this.stateChanged = stateCallback; }
    if (this.counter % 3 === 2) {
      s = 'connected';
      // setTimeout(() => {
      //   stateCallback('disconnected');
      // }, 10000);
    }

    if (this.counter % 3 === 1) { s = 'failed'; }
    if (this.counter % 3 === 0) { s = 'forbidden'; }
    this.counter += 1;

    setTimeout(() => {
      stateCallback(s);
    }, 2000);
  }
  disconnect(): void {
    this.stateChanged('disconnected');
  }
  sendCAD(): void {}
  refresh(): void {}
  resolve(): void {}
  toggleScale(): void {}
  fullscreen(): void {}
  showKeyboard(): void {}
  showExtKeypad(): void {}
  showTrackpad(): void {}
  copy(): void {}
  paste(): void {}
  dispose(): void {}
}
