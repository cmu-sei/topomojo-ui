// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { Subject, Observable, merge, scheduled, asyncScheduler, timer, of } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, tap, zipAll } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { GameState, GamespaceRegistration } from '../api/gen/models';
import { faBolt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfigService } from '../config.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-gamespace',
  templateUrl: './gamespace.component.html',
  styleUrls: ['./gamespace.component.scss']
})
export class GamespaceComponent implements OnInit {
  gamespace$: Observable<GameState>;
  changed$ = new Subject<GameState>();
  state!: GameState;
  errors: any[] = [];
  launching = false;
  deploying = false;

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

  constructor(
    route: ActivatedRoute,
    private api: GamespaceService,
    private conf: ConfigService
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
      ),
      this.changed$,
      timer(0, 1000).pipe(
        filter(() => !!this.state && !!this.state.id),
        map(i => api.transform(this.state) as GameState)
      )
    ).pipe(
      tap(g => this.state = g)
    );

  }

  ngOnInit(): void {
  }

  launch(): void {
    this.launching = true;
    this.api.register(this.settings).pipe(
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

}
