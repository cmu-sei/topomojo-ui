// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faBolt, faClipboard, faShareAlt, faTrash, faTv } from '@fortawesome/free-solid-svg-icons';
import { ClipboardService } from 'projects/topomojo-work/src/app/clipboard.service';
import { asyncScheduler, combineLatest, interval, Observable, of, scheduled, Subject, timer } from 'rxjs';
import { catchError, debounceTime, finalize, map, mergeAll, switchMap, tap } from 'rxjs/operators';
import { GameState, TimeWindow, VmState } from './api.models';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'launchpoint';
  state$: Observable<GameState>;
  starting$ = new Subject<GameState>();
  stopping$ = new Subject<GameState>();
  ending$ = new Subject<GameState>();
  acting = false;
  showDetail = false;
  inviteCopied = false;
  inviteCode = '';
  subjectName = '';
  timewindow!: TimeWindow;
  errorMsg = '';

  faTv = faTv;
  faTrash = faTrash;
  faBolt = faBolt;
  faClipboard = faClipboard;
  faShare = faShareAlt;

  constructor(
    route: ActivatedRoute,
    private api: ApiService,
    private clipboard: ClipboardService
  ) {

    const actions$ = scheduled([
      this.starting$.pipe(
        switchMap(g => api.start(g.id || '')),
        tap(() => this.acting = false)
      ),
      this.stopping$.pipe(
        switchMap(g => api.stop(g.id || '')),
        tap(() => this.acting = false)
      ),
      this.ending$.pipe(
        switchMap(g => api.complete(g.id || '')),
        tap(() => this.acting = false)
      ),
      route.queryParams.pipe(
        // debounceTime(100),
        tap(p => this.inviteCode = p.c || ''),
        switchMap(p => api.login(p.t).pipe(
          catchError(err => of({})),
          map(() => p)
        )),
        switchMap(p => api.launch(p.g).pipe(
          catchError(err => of(({error: err.error?.message || err.statusText}) as GameState))
        ))
      )
    ], asyncScheduler).pipe(
      finalize(() => this.acting = false),
      mergeAll()
    );

    this.state$ = combineLatest([
      actions$,
      timer(0, 1000)
    ]).pipe(
      map(([g, n]) => ({...g, ...(new TimeWindow(g.startTime, g.endTime))})),
      tap(g => this.timewindow = new TimeWindow(g.startTime, g.expirationTime))
    );

    interval(1800000).pipe(
      switchMap(() => api.login(''))
    ).subscribe();

  }

  open(vm: VmState): void {
    this.api.openConsole(
      `?f=1&s=${vm.isolationId}&v=${vm.name}`
    );
  }
  start(s: GameState): void {
    this.acting = true;
    this.starting$.next(s);
  }
  stop(s: GameState): void {
    this.acting = true;
    this.stopping$.next(s);
  }
  done(s: GameState): void {
    this.acting = true;
    this.ending$.next(s);
  }

  invite(s: GameState): void {
    // fetch code and put on clipboard
    this.api.invite(s.id || '').subscribe(result => {
      this.clipboard.copyToClipboard(
        `${location.origin}${location.pathname}?c=${result.code}`
      );
      this.inviteCopied = true;
      timer(3000).subscribe(() => this.inviteCopied = false);
    });
  }

  join(): void {
    if (!this.inviteCode || !this.subjectName) {
      return;
    }

    const model = {
      code: this.inviteCode,
      name: this.subjectName
    };

    this.api.enlist(model).subscribe(
      result => {
        window.location.search = `g=${result.gamespaceId}&t=${result.token}`;
      },
      (err) => this.errorMsg = err.error?.message || err.message || err
    );

  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    if (ev.ctrlKey) {
      switch (ev.code) {
        case 'KeyJ':
          this.showDetail = !this.showDetail;
          break;
      }
    }

    return true;
  }
}
