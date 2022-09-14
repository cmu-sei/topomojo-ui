// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Observable, merge, scheduled, asyncScheduler, timer, of, Subscription } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, tap, zipAll } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { GameState, GamespaceRegistration, JoinCode } from '../api/gen/models';
import { faBolt, faClipboardCheck, faShare, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfigService } from '../config.service';
import { ActivatedRoute } from '@angular/router';
import { ClipboardService } from '../clipboard.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-gamespace',
  templateUrl: './gamespace.component.html',
  styleUrls: ['./gamespace.component.scss']
})
export class GamespaceComponent implements OnInit, OnDestroy {
  gamespace$: Observable<GameState>;
  changed$ = new Subject<GameState>();
  state!: GameState;
  errors: any[] = [];
  launching = false;
  deploying = false;
  invited = false;

  settings: GamespaceRegistration = {
    resourceId: '',
    variant: 0,
    maxAttempts: 3,
    maxMinutes: 0,
    points: 100,
    allowReset: false,
    allowPreview: false,
    startGamespace: true
  };

  faBolt = faBolt;
  faTrash = faTrash;
  faShare = faShare;
  faClipboardCheck = faClipboardCheck;

  constructor(
    route: ActivatedRoute,
    private api: GamespaceService,
    private conf: ConfigService,
    private clip: ClipboardService,
    private hub: NotificationService
  ) {

    const loaded$ = (id: string) => scheduled([
      api.load(id).pipe(catchError(err => of({} as GameState))),
      api.preview(id).pipe(catchError(err => of({} as GameState)))
    ], asyncScheduler).pipe(
      zipAll(),
      map(([g, w]) => !!g.id ? g : w)
    );

    this.gamespace$ = merge(
      route.params.pipe(
        tap(p => this.settings.resourceId = p.id),
        switchMap(p => loaded$(p.id)),
        tap(g => { if (g.isActive) { hub.joinChannel(g.id); } })
      ),
      this.changed$,
      hub.gameEvents.pipe(
        map(e => api.transform(e.model) as GameState),
        tap(e => console.log(e))
      ),
      timer(0, 1000).pipe(
        filter(() => !!this.state && !!this.state.id),
        map(i => api.transform(this.state) as GameState)
      )
    ).pipe(
      tap(g => this.state = g)
    );

    // todo: if /c=code, api.createPlayer(code)

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.hub.leaveChannel();
  }

  launch(): void {
    this.launching = true;
    this.api.register(this.settings).pipe(
      tap(g => { if (g.isActive) { this.hub.joinChannel(g.id); } }),
      finalize(() => this.launching = false)
    ).subscribe(
      gs => this.changed$.next(gs),
      err => this.errors.push(err)
    );
  }

  complete(id: string | undefined): void {
    this.launching = true;
    this.api.complete(this.state.id).pipe(
      finalize(() => this.launching = false)
    ).subscribe(
      gs => this.changed$.next(gs),
      err => this.errors.push(err)
    );
  }

  invite(state: GameState): void {
    if (!state?.id) { return; }
    this.invited = false;
    this.api.invite(state.id).subscribe(
      (result: JoinCode) => {
        this.clip.copyToClipboard(
          this.conf.externalUrl(`/mojo/${state.id}/${state.slug}/${result.code}`)
        );
        this.invited = true;
        const c: Subscription = timer(3000).pipe(
          tap(() => this.invited = false),
          finalize(() => c.unsubscribe())
        ).subscribe();
      }
    );
  }
}
