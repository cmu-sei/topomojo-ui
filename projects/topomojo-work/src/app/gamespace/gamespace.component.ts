// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Subject, Observable, merge } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { GameState, GamespaceRegistration, Vm, VmState } from '../api/gen/models';
import { faBolt, faToggleOff, faToggleOn, faTrash, faTv } from '@fortawesome/free-solid-svg-icons';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-gamespace',
  templateUrl: './gamespace.component.html',
  styleUrls: ['./gamespace.component.scss']
})
export class GamespaceComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() id!: string;
  id$ = new Subject<string>();
  gs$ = new Subject<GameState>();
  gamespace$: Observable<GameState>;
  gid = '';
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
  faTv = faTv;
  faToggleOn = faToggleOn;
  faToggleOff = faToggleOff;

  constructor(
    private api: GamespaceService,
    private conf: ConfigService
  ) {
    this.gamespace$ = merge(
      this.id$.pipe(
        tap(id => this.settings.resourceId = id),
        switchMap(id => api.preview(id))
      ),
      this.gs$
    ).pipe(
      tap(g => this.gid = g.id)
    );
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.id$.next(changes.id.currentValue);
  }

  ngAfterViewInit(): void {
    // initial "change" happens before subscription, so fire here after subscribed
    this.id$.next(this.id);
  }

  launch(): void {
    this.launching = true;
    this.api.register(this.settings).pipe(
      finalize(() => this.launching = false)
    ).subscribe(
      gs => this.gs$.next(gs),
      err => this.errors.push(err)
    );
  }

  reset(id: string | undefined): void {
    if (!id) { return; }
    this.launching = true;
    this.api.delete(id).pipe(
      finalize(() => this.launching = false)
    ).subscribe(
      () => this.id$.next(this.id)
    );
  }

  start(): void {
    if (!this.gid) { return; }
    this.deploying = true;
    this.api.start(this.gid).pipe(
      finalize(() => this.deploying = false)
    ).subscribe(
      gs => this.gs$.next(gs)
    );
  }

  stop(): void {
    if (!this.gid) { return; }
    this.deploying = true;
    this.api.stop(this.gid).pipe(
      finalize(() => this.deploying = false)
    ).subscribe(
      gs => this.gs$.next(gs)
    );
  }

  console(vm: VmState): void {
    this.conf.openConsole(`?f=1&s=${this.gid}&v=${vm.name?.split('#')[0]}`);
  }

}
