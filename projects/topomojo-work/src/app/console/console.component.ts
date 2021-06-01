import {
  Component, OnInit, ViewChild, AfterViewInit,
  ElementRef, Input, Injector, HostListener, OnDestroy
} from '@angular/core';
import { catchError, debounceTime, map, distinctUntilChanged, tap } from 'rxjs/operators';
import { throwError as ObservableThrower, fromEvent, Subscription, timer } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { MockConsoleService } from './services/mock-console.service';
import { WmksConsoleService } from './services/wmks-console.service';
import { ConsoleService } from './services/console.service';
import { ConsoleSummary, VmOperationTypeEnum } from '../api.models';
import { ApiService } from '../api.service';
import { ClipboardService } from '../clipboard.service';

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
  @Input() info: ConsoleSummary = {};

  problemId: string;
  state = 'loading';
  isConnected = false;
  isMock = false;
  shadowstate = 'loading';
  shadowTimer: any;
  cliptext = '';
  stateButtonIcons: any = {};
  stateIcon = '';
  showTools = false;
  showClipboard = true;
  showCog = true;
  justClipped = false;
  justPasted = false;
  console: ConsoleService;
  canvasId = '';
  @ViewChild('consoleCanvas') consoleCanvas: ElementRef;
  subs: Array<Subscription> = [];
  private hotspot = { x: 0, y: 0, w: 8, h: 8 };

  constructor(
    private injector: Injector,
    private api: ApiService,
    private titleSvc: Title,
    private clipSvc: ClipboardService
  ) {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {

    this.initHotspot();

    const el = this.consoleCanvas.nativeElement;
    this.canvasId = el.id + this.index;
    el.id += this.index;

    if (!!this.info.name) {
      this.titleSvc.setTitle(`console: ${this.info.name}`);
    }

    setTimeout(() => this.create(this.info), 1);
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

    this.api.ticket(this.info.id)
      .pipe(
        catchError((err: Error) => {
          return ObservableThrower(err);
        })
      )
      .subscribe(
        (info: ConsoleSummary) => this.create(info),
        (err) => this.changeState('failed')
      );

  }

  create(info: ConsoleSummary): void {
    this.isMock = !!(info.url.match(/mock/i));
    this.console = this.isMock
      ? this.injector.get(MockConsoleService)
      : this.injector.get(WmksConsoleService);

    if (info.id) {
      if (info.isRunning) {
        this.console.connect(
          this.info.url,
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
    this.api.vmaction({
        id: this.info.id,
        type: VmOperationTypeEnum.start
      }).subscribe(
      () => this.reload()
    );
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
      fromEvent(document, 'mousemove').pipe(
        debounceTime(100),
        tap((e: MouseEvent) => {
          if (this.showTools && e.clientX > 400) {
            this.showTools = false;
          }
        }),
        map((e: MouseEvent) => {
          return this.isConnected && !this.showCog && e.clientX < 4;
        }),
        distinctUntilChanged()
      ).subscribe(hot => {
        if (hot) {
          this.showTools = true;
        }
      })
    );
  }

  @HostListener('window:resize', ['$event'])
  onResize(event): void {
    // this.hotspot.x = event.target.innerWidth - this.hotspot.w;
    this.console.refresh();
  }
}
