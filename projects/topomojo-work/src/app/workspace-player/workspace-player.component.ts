// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { faBolt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { merge, Observable, Subject, timer } from 'rxjs';
import { filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { GamespaceRegistration, GameState, Workspace } from '../api/gen/models';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-workspace-player',
  templateUrl: './workspace-player.component.html',
  styleUrls: ['./workspace-player.component.scss']
})
export class WorkspacePlayerComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() summary!: Workspace;
  id$ = new Subject<string>();
  changed$ = new Subject<GameState>();
  gamespace$: Observable<GameState>;
  state!: GameState;
  errors: any[] = [];

  launching = false;
  deploying = false;

  settings: GamespaceRegistration = {
    resourceId: '',
    variant: 0,
    maxAttempts: 3,
    maxMinutes: 60,
    points: 100,
    allowReset: true,
    allowPreview: false,
    startGamespace: true
  };

  faBolt = faBolt;
  faTrash = faTrash;

  constructor(
    private api: GamespaceService,
    private conf: ConfigService
  ) {
    this.gamespace$ = merge(
      this.id$.pipe(
        tap(id => this.settings.resourceId = id),
        switchMap(id => api.load(id)),
        tap(g => this.state = g)
      ),
      this.changed$.pipe(
        tap(g => this.state = g)
      ),
      timer(0, 1000).pipe(
        filter(() => !!this.state && !!this.state.id),
        map(i => api.transform(this.state) as GameState)
      )
    ).pipe(
    );
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.id$.next(changes.summary.currentValue.id);
  }

  ngAfterViewInit(): void {
    // initial "change" happens before subscription, so fire here after subscribed
    this.id$.next(this.summary.id);
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

  reset(id: string | undefined): void {
    if (!id) { return; }
    this.launching = true;
    this.api.delete(id).pipe(
      finalize(() => this.launching = false)
    ).subscribe(
      () => this.id$.next(this.summary.id)
    );
  }

}
