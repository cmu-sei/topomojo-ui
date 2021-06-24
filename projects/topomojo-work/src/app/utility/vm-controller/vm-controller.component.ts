// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Template, TemplateSummary, Vm, VmOperationTypeEnum } from '../../api/gen/models';
import { faCircleNotch, faSyncAlt, faCog, faBolt, faTv, faPlay, faStop, faSave, faStepBackward, faUndoAlt, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Observable, of, Subject, Subscription, timer } from 'rxjs';
import { VmService } from '../../api/vm.service';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
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
  task = '';
  confirming = false;
  vm$: Observable<Vm>;
  task$ = new Subject<string>();
  errors: Error[] = [];
  hubsub: Subscription;

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

  constructor(
    private api: VmService,
    private conf: ConfigService,
    private hub: NotificationService
  ) {
    this.vm$ = this.task$.pipe(
      // throttleTime(500),
      // tap(t => console.log('running task ' + t)),
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
          console.log(event.action + ' ' + event.model.id);
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
        q = this.api.initializeTemplate(this.template.id);
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
    // this.errors.push(new Error('Unfortch. Hit a snag.'));
    // this.api.openConsole(this.vm.id || '', this.vm.name || '');
    const p = this.vm.name?.split('#') || ['', ''];
    this.conf.openConsole(`?f=1&s=${p[1]}&v=${p[0]}`);
  }

}
