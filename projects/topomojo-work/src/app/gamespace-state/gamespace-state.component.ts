// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { faBolt, faTrash, faTv } from '@fortawesome/free-solid-svg-icons';
import { finalize } from 'rxjs/operators';
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
export class GamespaceStateComponent implements OnInit, OnChanges {
  @Input() game!: GameState;
  deploying = false;
  faBolt = faBolt;
  faTrash = faTrash;
  faTv = faTv;
  protected hasQuestions = false;
  isAdmin = false;
  orphanedVmCount = 0;

  constructor(
    private api: GamespaceService,
    private conf: ConfigService,
    private userSvc: UserService,
    private vmApi: VmService
  ) { }

  ngOnInit(): void {
    this.userSvc.user$.subscribe(u => {
      this.isAdmin = u?.isAdmin || false;
      this.checkOrphanedVms();
    });
  }

  ngOnChanges(): void {
    this.checkOrphanedVms();
  }

  private checkOrphanedVms(): void {
    if (this.isAdmin && !this.game.isActive && this.game.id) {
      // Check if VMs exist for this ended gamespace
      this.vmApi.list(this.game.id).subscribe(vms => {
        this.orphanedVmCount = vms.length;
      });
    }
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
