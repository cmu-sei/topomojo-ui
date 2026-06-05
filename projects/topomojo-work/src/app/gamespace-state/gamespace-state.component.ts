// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { faBolt, faTrash, faTv } from '@fortawesome/free-solid-svg-icons';
import { finalize, switchMap, filter, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { GamespaceService } from '../api/gamespace.service';
import { GameState, VmState } from '../api/gen/models';
import { ConfigService } from '../config.service';
import { UserService } from '../user.service';
import { VmService } from '../api/vm.service';

@Component({
  selector: 'app-gamespace-state',
  templateUrl: './gamespace-state.component.html',
  styleUrls: ['./gamespace-state.component.scss'],
  standalone: false
})
export class GamespaceStateComponent implements OnInit, OnChanges, OnDestroy {
  @Input() game!: GameState;
  deploying = false;
  faBolt = faBolt;
  faTrash = faTrash;
  faTv = faTv;
  protected hasQuestions = false;
  isAdmin = false;
  orphanedVmCount = 0;

  private destroy$ = new Subject<void>();
  private gameChange$ = new BehaviorSubject<GameState | null>(null);

  constructor(
    private api: GamespaceService,
    private conf: ConfigService,
    private userSvc: UserService,
    private vmApi: VmService
  ) { }

  ngOnInit(): void {
    // Combine user admin status with game changes to fetch orphaned VMs
    combineLatest([
      this.userSvc.user$,
      this.gameChange$
    ]).pipe(
      filter(([user, game]) =>
        !!game && (user?.isAdmin || false) && !game.isActive && !!game.id
      ),
      distinctUntilChanged(
        ([prevUser, prevGame], [currUser, currGame]) =>
          prevGame?.id === currGame?.id && prevGame?.isActive === currGame?.isActive
      ),
      switchMap(([user, game]) => this.vmApi.list(game!.id!)),
      takeUntil(this.destroy$)
    ).subscribe(vms => {
      this.orphanedVmCount = vms.length;
    });

    // Track admin status separately for template
    this.userSvc.user$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(u => {
      this.isAdmin = u?.isAdmin || false;
    });
  }

  ngOnChanges(): void {
    this.gameChange$.next(this.game);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  start(): void {
    if (!this.game.id) { return; }
    this.deploying = true;
    this.api.start(this.game.id).pipe(
      finalize(() => this.deploying = false)
    ).subscribe(
      gs => this.updateGame(gs)
    );
  }

  stop(): void {
    if (!this.game.id) { return; }
    this.deploying = true;
    this.api.stop(this.game.id).pipe(
      finalize(() => this.deploying = false)
    ).subscribe(
      gs => this.updateGame(gs)
    );
  }

  console(vm: VmState): void {
    this.conf.openConsole({
      name: vm.name?.split("#")[0],
      sessionId: this.game.id
    });
  }

  private updateGame(gs: GameState) {
    this.game = gs;
    this.hasQuestions = !!gs.challenge?.questions?.length;
  }
}
