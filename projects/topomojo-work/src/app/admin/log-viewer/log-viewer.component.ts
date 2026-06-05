// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faCaretDown, faCaretRight, faInfoCircle, faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
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
  copied = -1;
  hovering = -1;
  log$: Observable<any>;
  private copyTimer?: ReturnType<typeof setTimeout>;
  faCaretDown = faCaretDown;
  faCaretRight = faCaretRight;
  faInfoCircle = faInfoCircle;
  faClipboard = faClipboard;
  faClipboardCheck = faClipboardCheck;

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
    this.trace = this.trace === i ? -1 : i;
  }

  getLogText(ex: any): string {
    return `${ex.timestamp}\n${ex.message}\n\n${ex.stackTrace || ''}`;
  }

  copy(ex: any, i: number): void {
    const text = this.getLogText(ex);

    if (this.copyTimer) {
      clearTimeout(this.copyTimer);
    }

    navigator.clipboard.writeText(text)
      .then(() => {
        this.copied = i;
        this.copyTimer = setTimeout(() => this.copied = -1, 4000);
      })
      .catch(() => {
        // Copy failed, don't show success indicator
      });
  }
}
