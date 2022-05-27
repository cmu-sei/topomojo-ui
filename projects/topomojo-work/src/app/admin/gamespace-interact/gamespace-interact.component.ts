import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { faInfo, faInfoCircle, faRedo, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Subject, Subscription, timer } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { DispatchService } from '../../api/dispatch.service';
import { Dispatch, DispatchSearch, NewDispatch, Vm } from '../../api/gen/models';
import { HubEvent, NotificationService } from '../../notification.service';

@Component({
  selector: 'app-gamespace-interact',
  templateUrl: './gamespace-interact.component.html',
  styleUrls: ['./gamespace-interact.component.scss']
})
export class GamespaceInteractComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() id = '';
  @Input() vms: Vm[] = [];
  @ViewChild('scrolltarget') scrollDivEl!: ElementRef;

  $gid = new Subject<string>();
  $cmd = new Subject<NewDispatch>();
  $delete = new Subject<string>();
  dispatches: Dispatch[] = [];
  subs: Subscription[] = [];
  cmd = '';
  faTrash = faTrash;
  faRedo = faRedo;
  faInfo = faInfoCircle;

  constructor(
    private api: DispatchService,
    hub: NotificationService
  ) {
    this.subs.push(
      this.$gid.pipe(
        tap(g => this.dispatches = []),
        filter(g => !!g),
        tap(g => hub.joinChannel(g)),
        switchMap(g => api.list({ gs: g } as DispatchSearch)),
        tap(result => this.dispatches = result)
      ).subscribe(() => this.scrollToBottom(false)),

      this.$cmd.pipe(
        switchMap(d => api.create(d))
      ).subscribe(),

      this.$delete.pipe(
        switchMap(id => api.delete(id))
      ).subscribe(),

      hub.dispatchEvents.subscribe(e => this.handleEvent(e))
    );

  }

  handleEvent(e: HubEvent): void {

    const f = this.dispatches.find(d => d.id === e.model.id);

    // remove if deleted
    if (!!f && e.action === 'DISPATCH.DELETE') {
      this.dispatches.splice(
        this.dispatches.indexOf(f),
        1
      );
      return;
    }

    // update or add
    if (!!f) {
      if (e.model.whenUpdated > f.whenUpdated) {
        f.error = e.model.error;
        f.result = e.model.result;
        f.whenUpdated = e.model.whenUpdated;
      }
    } else {
      this.dispatches.push(e.model);
    }

    this.scrollToBottom(true);
  }

  ngAfterViewInit(): void {
    this.$gid.next(this.id);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.id) {
      this.$gid.next(changes.id.currentValue);
    }
  }

  ngOnInit(): void {
  }

  send(): void {
    const cmd = this.cmd.trim().split(' ').filter(x => !!x);

    if (!cmd.length) { return; }

    const target = cmd[0].match(/\[(.+)\]/)?.pop();

    if (!!target) { cmd.shift(); }

    this.$cmd.next({ targetGroup: this.id, targetName: target, trigger: cmd.join(' ') } as NewDispatch);

    this.cmd = '';
  }

  delete(id: string): void {
    this.$delete.next(id);
  }

  repeat(d: Dispatch): void {
    this.$cmd.next(d as unknown as NewDispatch);
  }

  scrollToBottom(smooth: boolean): void {

    timer(50).subscribe(i => {

      this.scrollDivEl.nativeElement.scroll({
        top: this.scrollDivEl.nativeElement.scrollHeight,
        left: 0,
        behavior: smooth ? 'smooth' : 'auto'
      });

    });

  }
}
