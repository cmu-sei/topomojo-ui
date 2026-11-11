// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, finalize, switchMap } from 'rxjs/operators';
import { Workspace } from '../api/gen/models';
import { WorkspaceCapacity, WorkspaceService } from '../api/workspace.service';

// How many more gamespaces of a workspace the hypervisor has room for.
@Component({
  selector: 'app-workspace-capacity',
  templateUrl: './workspace-capacity.component.html',
  styleUrls: ['./workspace-capacity.component.scss'],
  standalone: false
})
export class WorkspaceCapacityComponent implements OnChanges, OnDestroy {
  @Input() workspace!: Workspace;
  players = 1;
  capacity: WorkspaceCapacity | null = null;
  unavailable = false;
  loading = false;

  private load$ = new Subject<void>();
  private sub: Subscription;

  constructor(private api: WorkspaceService) {
    this.sub = this.load$.pipe(
      debounceTime(300),
      switchMap(() => {
        this.loading = true;
        return this.api.getCapacity(this.workspace.id, Math.max(1, this.players || 1)).pipe(
          catchError(() => of(null)),
          finalize(() => this.loading = false)
        );
      })
    ).subscribe(c => {
      this.capacity = c;
      this.unavailable = !c;
    });
  }

  // a players input only matters when some template's replicas follow the player count
  get followsPlayers(): boolean {
    return !!this.workspace?.templates?.some(t => t.replicas < 0);
  }

  ngOnChanges(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  refresh(): void {
    if (this.workspace?.id) {
      this.load$.next();
    }
  }

  fitsText(c: WorkspaceCapacity): string {
    if (c.fits === null) {
      return 'No templates yet, so nothing limits how many fit';
    }
    if (c.fits === 0) {
      return 'No more gamespaces fit';
    }
    return `${c.fits} more gamespace${c.fits === 1 ? ' fits' : 's fit'}`;
  }

  limitText(c: WorkspaceCapacity): string {
    switch (c.limitedBy) {
      case 'pool':
        return 'limited by the resource pool limit';
      case 'memory':
        return 'limited by hypervisor memory';
      default:
        return '';
    }
  }

  gb(mb: number): string {
    return (mb / 1024).toFixed(mb >= 102400 ? 0 : 1);
  }

  asOf(value: string): string {
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  }
}
