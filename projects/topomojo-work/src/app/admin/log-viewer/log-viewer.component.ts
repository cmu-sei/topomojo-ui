// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { AdminService } from '../../api/admin.service';

@Component({
    selector: 'app-log-viewer',
    templateUrl: './log-viewer.component.html',
    styleUrls: ['./log-viewer.component.scss'],
    standalone: false
})
export class LogViewerComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  since = '';
  trace = -1;
  log$: Observable<any>;
  faCaretDown = faCaretDown;
  faCaretRight = faCaretRight;

  constructor(
    api: AdminService
  ) {
    this.log$ = merge(
      this.refresh$,
      interval(30000)
    ).pipe(
      switchMap(() => api.getlog(this.since)),
      // tap(r => console.log(r))
      // tap(() => this.since = (new Date()).toISOString())
    );
  }

  ngOnInit(): void {
  }

  select(i: number): void {
    this.trace = i;
  }
}
