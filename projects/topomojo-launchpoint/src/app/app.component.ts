// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, HostListener } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faBolt, faTrash, faTv } from '@fortawesome/free-solid-svg-icons';
import { asyncScheduler, combineLatest, interval, merge, Observable, of, scheduled, Subject, timer } from 'rxjs';
import { catchError, map, mergeAll, switchMap, tap } from 'rxjs/operators';
import { GameState, LaunchParams, TimeWindow, Vm, VmState } from './api.models';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'launchpoint';
  launchParams!: LaunchParams;
  state$: Observable<GameState>;
  starting$ = new Subject<GameState>();
  stopping$ = new Subject<GameState>();
  ending$ = new Subject<GameState>();
  acting = false;
  showDetail = false;
  timewindow!: TimeWindow;

  faTv = faTv;
  faTrash = faTrash;
  faBolt = faBolt;

  constructor(
    route: ActivatedRoute,
    private api: ApiService
  ) {

    const actions$ = scheduled([
      this.starting$.pipe(
        switchMap(g => api.start(g.id || ''))
      ),
      this.stopping$.pipe(
        switchMap(g => api.stop(g.id || ''))
      ),
      this.ending$.pipe(
        switchMap(g => api.complete(g.id || ''))
      ),
      route.queryParams.pipe(
        map(p => ({token: p.t, gid: p.g})),
        tap(m => this.launchParams = m),
        switchMap(p => api.login(p.token)),
        tap(r => console.log(r)),
        switchMap(u => api.launch(this.launchParams.gid))
      )
    ], asyncScheduler).pipe(
      mergeAll(),
      catchError(err => of(({error: err.error?.message || err.statusText} as GameState))),
      tap(r => this.acting = false)
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
