// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Template, TemplateSummary, Vm, VmOperationTypeEnum } from '../../api/gen/models';
import { faCircleNotch, faSyncAlt, faCog, faBolt, faTv, faPlay, faStop, faSave, faStepBackward, faUndoAlt, faTrash, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Observable, of, Subject, Subscription, timer } from 'rxjs';
import { VmService } from '../../api/vm.service';
import { catchError, debounceTime, finalize, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from '../../notification.service';
import { ConfigService } from '../../config.service';

@Component({
  selector: 'app-vm-controller',
  templateUrl: './vm-controller.component.html',
  styleUrls: ['./vm-controller.component.scss']
})
export class VmControllerComponent implements OnInit, OnDestroy {
  @Input() template: (Template | TemplateSummary) = { id: '', name: '', workspaceId: ''};
  @Input() vm: Vm = {};
  @Input() hideDelete = false;
  @Input() fullbleed = true;
  task = '';
  confirming = false;
  vm$: Observable<Vm>;
  task$ = new Subject<string>();
  errors: Error[] = [];
  hubsub: Subscription;
  confirmation_task = "";

  faCircleNotch = faCircleNotch;
  faSyncAlt = faSyncAlt;
  faCog = faCog;
  faBolt = faBolt;
  faTv = faTv;
  faPlay = faPlay;
  faStop = faStop;
  faSave = faSave;
  faStepBackward = faStepBackward;
  faUndoAlt = faUndoAlt;
  faTrash = faTrash;
  faTimes = faTimes;
  faCheck = faCheck;

  constructor(
    private api: VmService,
    private conf: ConfigService,
    private hub: NotificationService
  ) {
    this.vm$ = this.task$.pipe(
      debounceTime(300),
      tap(t => this.task = !!t ? t : this.task),
      switchMap(t => this.taskQuery(t)),
      catchError((err: Error) => {
        this.errors.push(err);
        return of({});
      }),
      tap(vm => this.taskResolve(vm))
    );

    this.hubsub = hub.vmEvents.subscribe(
      (event) => {
        if (event.model.id === this.vm.id) {
          // console.log(event.action + ' ' + event.model.id);
          if (event.action === 'VM.DELETE') { this.vm = {}; }
          this.do('refresh');
        }
        if (event.action === 'VM.DEPLOY' && event.model.id === this.template.id) {
          this.do('refresh');
        }
      }
    );
  }

  ngOnInit(): void {
    timer(0).subscribe(
      () => this.task$.next('refresh')
    );
  }

  ngOnDestroy(): void {
    this.hubsub.unsubscribe();
  }

  taskQuery(task: string): Observable<Vm> {
    let q = of({});

    switch (task) {

      case 'initialize':
        q = this.api.initializeTemplate(this.template.id).pipe(
          map(i => ({...this.vm, task: {progress: i}} as Vm) )
        );
        break;

      case 'deploy':
        q = this.api.deployTemplate(this.template.id);
        break;

      case 'refresh':
      case '':
        q = (this.vm && this.vm.id)
        ? this.api.load(this.vm.id)
        : this.api.getTemplateVm(this.template.id);
        break;

      default: // start stop save revert delete
        q = this.api.updateState({
          id: this.vm.id || '',
          type: task as VmOperationTypeEnum
        });
        break;
    }

    return q;
  }

  // process query result
  taskResolve(vm: Vm): void {

    this.vm = this.task !== 'delete'
      ? vm
      : { status: 'initialized' };

    // if still in progess, poll
    if (vm.task && (vm.task.progress || 0) < 100) {
      timer(2000).pipe(
        finalize(() => this.task$.next(''))
      ).subscribe();

    } else {

      // clean up
      this.task = '';
    }
  }

  do(task: string): void {
    this.task$.next(task);
  }

  console(): void {
    const p = this.vm.name?.split('#') || ['', ''];
    const f = this.fullbleed ? 1 : 0;
    this.conf.openConsole(`?f=${f}&s=${p[1]}&v=${p[0]}`);
  }

  confirm(t: string): void {
    this.confirmation_task = t;
    this.confirming = true;
  }
}
