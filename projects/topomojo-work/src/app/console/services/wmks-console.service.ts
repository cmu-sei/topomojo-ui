import { Injectable } from '@angular/core';
import { ConsoleService } from './console.service';
declare var WMKS: any;

@Injectable()
export class WmksConsoleService implements ConsoleService {
  private wmks;
  options: any = {
    rescale: true,
    changeResolution: true,
    useVNCHandshake: false,
    position: 0, // WMKS.CONST.Position.CENTER,
  };
  stateChanged: (state: string) => void;

  constructor() { }

  connect(url: string, stateCallback: (state: string) => void, options: any = {} ): void {

    if (stateCallback) { this.stateChanged = stateCallback; }
    this.options = {...this.options, ...options};

    if (this.wmks) {
      this.wmks.destroy();
      this.wmks = null;
    }

    let wmks = WMKS.createWMKS(options.canvasId, this.options)
    .register(WMKS.CONST.Events.CONNECTION_STATE_CHANGE, (event, data) => {

      switch (data.state) {
        case WMKS.CONST.ConnectionState.CONNECTED:
        stateCallback('connected');
        break;

        case WMKS.CONST.ConnectionState.DISCONNECTED:
        stateCallback('disconnected');
        wmks.destroy();
        wmks = null;
        break;
      }
    })
    .register(WMKS.CONST.Events.REMOTE_SCREEN_SIZE_CHANGE, (e, data) => {
      // console.log('wmks remote_screen_size_change: ' + data.width + 'x' + data.height);
      // TODO: if embedded, pass along dimension to canvas wrapper element
    })
    .register(WMKS.CONST.Events.HEARTBEAT, (e, data) => {
        // debug('wmks heartbeat: ' + data);
        console.log('wmks heartbeat: ' + data);
    })
    .register(WMKS.CONST.Events.COPY, (e, data) => {
        // console.log('wmks copy: ' + data);
        stateCallback('clip:' + data);
    })
    .register(WMKS.CONST.Events.ERROR, (e, data) => {
        // debug('wmks error: ' + data.errorType);

    })
    .register(WMKS.CONST.Events.FULL_SCREEN_CHANGE, (e, data) => {
        // debug('wmks full_screen_change: ' + data.isFullScreen);
    });

    this.wmks = wmks;

    try {
      this.wmks.connect(url);
    } catch (err) {
      stateCallback('failed');
    }
  }

  disconnect(): void {
    if (this.wmks) {
      this.wmks.disconnect();
      this.stateChanged('disconnected');
      if (this.options.hideDisconnectedScreen ) {
        this.dispose();
      }
    }
  }

  sendCAD(): void {
    if (this.wmks) {
      this.wmks.sendCAD();
    }
  }

  copy(): void {
    if (this.wmks) {
      this.wmks.grab();
    }
  }

  async paste(text: string): Promise<void> {
    if (this.wmks) {
      for (const line of text.split('\n')) {
        this.wmks.sendInputString(line);
        this.wmks.sendInputString('\n');
        await new Promise(r => setTimeout(r, 40));
      }
    }
  }

  refresh(): void {
    if (this.wmks && this.options.rescale) {
      this.wmks.updateScreen();
    }
  }

  toggleScale(): void {
    if (this.wmks) {
      this.options.rescale = !this.options.rescale;
      this.wmks.setOption('rescale', this.options.rescale);
    }
  }

  fullscreen(): void {
    if (this.wmks && !this.wmks.isFullScreen() && this.wmks.canFullScreen()) {
      this.wmks.enterFullScreen();
    }
  }

  showKeyboard(): void {
    if (this.wmks) {
      this.wmks.showKeyboard();
    }
  }

  showExtKeypad(): void {
    if (this.wmks) {
      this.wmks.toggleExtendedKeypad();
    }
  }

  showTrackpad(): void {
    if (this.wmks) {
      this.wmks.toggleTrackpad();
    }
  }

  dispose(): void {
    if (this.wmks && this.wmks.destroy) {
      console.log('disposing wmks');
      this.wmks.destroy();
      this.wmks = null;
    }
  }
}
