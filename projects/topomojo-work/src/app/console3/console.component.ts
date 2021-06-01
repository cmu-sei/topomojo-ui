import {
  Component, OnInit, ViewChild, AfterViewInit,
  ElementRef, Input, Injector, HostListener, OnDestroy, Renderer2
} from '@angular/core';
import { catchError, debounceTime, map, distinctUntilChanged, tap, finalize } from 'rxjs/operators';
import { throwError as ObservableThrower, fromEvent, Subscription, timer, Observable, of, VirtualTimeScheduler } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { MockConsoleService } from './services/mock-console.service';
import { WmksConsoleService } from './services/wmks-console.service';
import { ConsoleService } from './services/console.service';
import { ConsolePresence, ConsoleRequest, ConsoleSummary } from '../api.models';
import { ApiService } from '../api.service';
import { ClipboardService } from '../clipboard.service';
import { HubService } from '../hub.service';

@Component({
  selector: 'app-console',
  templateUrl: './console.component.html',
  styleUrls: ['./console.component.scss'],
  providers: [
    MockConsoleService,
    WmksConsoleService
  ]
})
export class ConsoleComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() index = 0;
  @Input() viewOnly = false;
  @Input() request!: ConsoleRequest;
  @ViewChild('consoleCanvas') consoleCanvas!: ElementRef;
  @ViewChild('audienceDiv') audienceDiv!: ElementRef;
  canvasId = '';
  console!: ConsoleService;

  // info!: ConsoleSummary;
  // problemId: string;
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
  subs: Array<Subscription> = [];
  audience: Observable<ConsolePresence[]>;
  private audiencePos!: MouseEvent | null;
  private audienceEl: any;

  private hotspot = { x: 0, y: 0, w: 8, h: 8 };

  constructor(
    private injector: Injector,
    private api: ApiService,
    private titleSvc: Title,
    private clipSvc: ClipboardService,
    private hubSvc: HubService,
    private renderer: Renderer2
  ) {
    this.audience = hubSvc.audience;
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

    this.initHotspot();

    const el = this.consoleCanvas.nativeElement;
    this.canvasId = el.id + this.index;
    el.id += this.index;

    if (!!this.request?.name) {
      this.titleSvc.setTitle(`console: ${this.request.name.split('-').pop()}`);
    }

    setTimeout(() => this.reload(), 1);
    setTimeout(() => this.hubSvc.init(this.request), 100);

    this.audienceDiv.nativeElement.onmousedown = (e: MouseEvent) => {
      e.preventDefault();
      this.audiencePos = e;
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    if (this.console) { this.console.dispose(); }
  }

  // private startDrag(e: MouseEvent): void {
  //   console.log(e);
  //   this.audiencePos = e;
  // }

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
      catchError((err: Error) => {
        // testing
        return of({
          id: '1234',
          name: 'vm',
          isolationId: '5555',
          url: 'ws://local.mock/ticket/1234',
          isRunning: true
        });
        return ObservableThrower(err);
      })
    ).subscribe(
      (info: ConsoleSummary) => this.create(info),
      (err) => this.changeState('failed')
    );

  }

  create(info: ConsoleSummary): void {
    // this.info = info;

    this.isMock = !!(info.url.match(/mock/i));

    this.console = this.isMock
      ? this.injector.get(MockConsoleService)
      : this.injector.get(WmksConsoleService);

    if (info.id) {
      if (info.isRunning) {
        this.console.connect(
          info.url,
          (state: string) => this.changeState(state),
          { canvasId: this.canvasId, viewOnly: this.viewOnly }
        );
      } else {
        this.changeState('stopped');
      }
    } else {
      this.changeState('failed');
    }
  }

  start(): void {
    this.changeState('starting');
    this.api.power(this.request).pipe(
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
      this.console.fullscreen();
      this.showTools = false;
    }
  }

  resize(): void {
    this.console.refresh();
  }

  resolve(): void {
    this.console.resolve();
  }

  scale(): void {
    this.console.toggleScale();
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

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    // this.hotspot.x = event.target.innerWidth - this.hotspot.w;
    this.console.refresh();
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
