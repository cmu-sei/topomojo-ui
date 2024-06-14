// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import {
  Component, OnInit, ViewChild, AfterViewInit,
  ElementRef, Input, Injector, HostListener, OnDestroy, Renderer2,
} from '@angular/core';
import { catchError, debounceTime, map, distinctUntilChanged, tap, finalize, switchMap } from 'rxjs/operators';
import { fromEvent, Subscription, timer, Observable, of, Subject } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { MockConsoleService } from './services/mock-console.service';
import { WmksConsoleService } from './services/wmks-console.service';
import { ConsoleService } from './services/console.service';
import { ConsolePresence, ConsoleRequest, ConsoleSummary } from '../api.models';
import { ApiService } from '../api.service';
import { ClipboardService } from '../clipboard.service';
import { HubService } from '../hub.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NoVNCConsoleService } from './services/novnc-console.service';
import { ConsoleSupportsFeatures } from './console.models';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
  providers: [
    MockConsoleService,
    WmksConsoleService,
    NoVNCConsoleService
  ]
})
export class ConsoleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() index = 0;
  @Input() viewOnly = false;
  @Input() request!: ConsoleRequest;
  @ViewChild('consoleCanvas') consoleCanvas!: ElementRef;
  @ViewChild('audienceDiv') audienceDiv!: ElementRef;
  canvasId = '';
  vmId = '';
  console!: ConsoleService;

  state = 'loading';
  shadowstate = 'loading';
  shadowTimer: any;
  isConnected = false;
  isMock = false;
  cliptext = '';
  stateButtonIcons: any = {};
  stateIcon = '';
  showTools = false;
  showClipboard = true;
  showCog = true;
  justClipped = false;
  justPasted = false;
  nets$: Observable<string[]>;
  changedNet = '';
  netIndex = '';
  refreshNets$ = new Subject<boolean>();
  subs: Array<Subscription> = [];
  audience: Observable<ConsolePresence[]>;

  protected clipboardHelpMarkdown$ = of("");
  protected enableAutoCopyVmSelection = false;
  protected consoleSupportsFeatures?: ConsoleSupportsFeatures;

  private audiencePos!: MouseEvent | null;

  constructor(
    private injector: Injector,
    private api: ApiService,
    private titleSvc: Title,
    private clipSvc: ClipboardService,
    private hubSvc: HubService,
    private renderer: Renderer2
  ) {
    this.audience = hubSvc.audience;

    api.heartbeat$.subscribe(
      good => {
        if (!good) {
          this.reload();
        }
      }
    );

    this.nets$ = this.refreshNets$.pipe(
      debounceTime(500),
      switchMap(() => api.nets(this.request.sessionId || '')),
      map(r => r.net)
    );
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.initHotspot();

    const el = this.consoleCanvas.nativeElement;
    this.canvasId = el.id + this.index;
    el.id += this.index;

    if (!!this.request?.name) {
      this.titleSvc.setTitle(`console: ${this.request.name}`);
    }

    setTimeout(() => this.reload(), 1);
    // TODO: restore audience hub
    // setTimeout(() => this.hubSvc.init(this.request), 100);

    this.audienceDiv.nativeElement.onmousedown = (e: MouseEvent) => {
      e.preventDefault();
      this.audiencePos = e;
    };
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.console) { this.console.dispose(); }
  }

  changeState(state: string): void {
    if (state.startsWith('clip:')) {
      this.cliptext = state.substring(5);
      this.clipSvc.copyToClipboard(this.cliptext);
      return;
    }

    this.state = state;
    this.shadowState(state);
    this.isConnected = state === 'connected';

    switch (state) {
      case 'stopped':
        this.stateIcon = 'Power On';
        break;

      case 'disconnected':
        this.stateIcon = 'Reload';
        break;

      case 'forbidden':
        this.stateIcon = 'Forbidden';
        break;

      case 'failed':
        this.stateIcon = 'Failed';
        break;

      case 'unauthorized':
        this.stateIcon = 'Unauthorized';
        break;

      default:
        this.stateIcon = '';
    }
  }

  stateButtonClicked(): void {
    switch (this.state) {
      case 'stopped':
        this.start();
        break;

      default:
        this.reload();
        break;
    }
  }

  reload(): void {
    this.changeState('loading');
    this.api.ticket(this.request).pipe(
      catchError((err: HttpErrorResponse) => of({ error: err.statusText.toLowerCase() } as unknown as ConsoleSummary))
    ).subscribe(
      (info: ConsoleSummary) => this.create(info),
      (err) => this.changeState('failed')
    );

    // // testing
    // of({
    //   id: '1234',
    //   name: 'vm',
    //   isolationId: '5555',
    //   url: 'ws://local.mock/ticket/1234',
    //   isRunning: true
    // }).subscribe(
    //   (info: ConsoleSummary) => this.create(info),
    //   (err) => this.changeState('failed')
    // );
  }

  create(info: ConsoleSummary): void {
    if (!!info.error) {
      this.changeState(info.error);
      return;
    }

    if (!info.id) {
      this.changeState('failed');
      return;
    }

    if (!info.url || !info.isRunning) {
      this.changeState('stopped');
      return;
    }

    this.vmId = info.id;
    this.isMock = !!(info.url.match(/mock/i));

    if (this.isMock) {
      this.console = this.injector.get(MockConsoleService);
    } else if (info.ticket != null) {
      this.console = this.injector.get(NoVNCConsoleService);
    } else {
      this.console = this.injector.get(WmksConsoleService);
    }

    this.console.connect(info.url, (state: string) => this.changeState(state), {
      canvasId: this.canvasId,
      viewOnly: this.viewOnly,
      changeResolution: !!this.request.fullbleed,
      ticket: info.ticket,
    });

    this.clipboardHelpMarkdown$ = this.console.clipboardHelpText$;
    this.consoleSupportsFeatures = this.console.getSupportedFeatures();

    if (this.consoleSupportsFeatures.autoCopyVmSelection) {
      this.handleAutoCopyVmEnableToggle(true);
    }
  }

  start(): void {
    this.changeState('starting');
    const t = {
      id: `${this.request.name}#${this.request.sessionId}`,
      op: 'reset'
    };
    this.api.power(t).pipe(
      finalize(() => this.reload())
    ).subscribe();
  }

  shadowState(state: string): void {
    this.shadowstate = state;
    if (this.shadowTimer) { clearTimeout(this.shadowTimer); }
    this.shadowTimer = setTimeout(() => { this.shadowstate = ''; }, 5000);
  }

  showUtilities(): void {
    this.showTools = !this.showTools;
  }

  enterFullscreen(): void {
    if (!!this.console) {
      this.console.fullscreen(this.consoleCanvas);
      this.showTools = false;
    }
  }

  resize(): void {
    this.console.refresh();
  }

  resolve(): void {
    // this.console.resolve();
    this.request.fullbleed = !this.request.fullbleed;
    this.reload();
  }

  scale(): void {
    this.console.toggleScale();
  }

  getNet(): void {
    this.refreshNets$.next(true);
  }

  setNet(net: string): void {
    this.changedNet = '';
    this.api.update(this.vmId, { key: 'net', value: net + this.netIndex }).subscribe(
      () => {
        this.changedNet = net;
      }
    );
  }

  clip(): void {
    this.console.copy();
    this.justClipped = true;
    timer(2000).subscribe(i => this.justClipped = false);
  }

  paste(): void {
    this.console.paste(this.cliptext);
    this.justPasted = true;
    timer(2000).subscribe(i => this.justPasted = false);
  }

  initHotspot(): void {
    // this.hotspot.x = window.innerWidth - this.hotspot.w;
    this.subs.push(
      fromEvent<MouseEvent>(document, 'mousemove').pipe(
        tap((e: MouseEvent) => {
          if (this.showTools && e.clientX > 400) {
            this.showTools = false;
          }
        }),
        map((e: MouseEvent) => {
          return this.isConnected && !this.showCog && e.clientX < 4;
        }),
        debounceTime(100),
        distinctUntilChanged()
      ).subscribe(hot => {
        if (hot) {
          this.showTools = true;
        }
      })
    );
  }

  protected handleAutoCopyVmEnableToggle(isEnabled: boolean) {
    this.enableAutoCopyVmSelection = isEnabled;
    this.console.setAutoCopyVmSelection(isEnabled);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    // this.hotspot.x = event.target.innerWidth - this.hotspot.w;
    this.console?.refresh();
  }

  @HostListener('window:focus', ['$event'])
  onFocus(): void {
    this.hubSvc.focus();
  }

  @HostListener('window:blur', ['$event'])
  onBlur(): void {
    this.hubSvc.blur();
  }

  @HostListener('document:mouseup', ['$event'])
  dragged(): void {
    this.audiencePos = null;
  }

  @HostListener('document:mousemove', ['$event'])
  dragging(e: MouseEvent): void {
    if (!!this.audiencePos) {
      e.preventDefault();

      const deltaX = this.audiencePos.clientX - e.clientX;
      const deltaY = this.audiencePos.clientY - e.clientY;

      this.renderer.setStyle(
        this.audienceDiv.nativeElement,
        'top',
        this.audienceDiv.nativeElement.offsetTop - deltaY + 'px'
      );

      this.renderer.setStyle(
        this.audienceDiv.nativeElement,
        'left',
        this.audienceDiv.nativeElement.offsetLeft - deltaX + 'px'
      );

      this.audiencePos = e;
    }
  }
}
