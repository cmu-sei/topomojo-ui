// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { faBolt, faTrash, faTv } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { GameState, VmState } from '../api/gen/models';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-gamespace-state',
  templateUrl: './gamespace-state.component.html',
  styleUrls: ['./gamespace-state.component.scss']
})
export class GamespaceStateComponent implements OnInit {
  @Input() game!: GameState;
  deploying = false;
  faBolt = faBolt;
  faTrash = faTrash;
  faTv = faTv;
  protected hasQuestions = false;

  constructor(
    private api: GamespaceService,
    private conf: ConfigService
  ) { }

  ngOnInit(): void {
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
    this.conf.openConsole(`?f=1&s=${this.game.id}&v=${vm.name?.split('#')[0]}`);
  }

  private updateGame(gs: GameState) {
    this.game = gs;
    this.hasQuestions = !!gs.challenge?.questions?.length;
  }

}
