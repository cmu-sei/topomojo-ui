// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, concat, from, Observable, of, scheduled, zip } from 'rxjs';
import { catchError, concatAll, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Workspace, WorkspaceStats } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { ConfigService } from '../config.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-workspace-editor',
  templateUrl: './workspace-editor.component.html',
  styleUrls: ['./workspace-editor.component.scss']
})
export class WorkspaceEditorComponent implements OnInit, OnDestroy {

  summary: Observable<Workspace>;
  section = 'settings';
  guid = '';
  errors: any[] = [];
  err: any;

  constructor(
    config: ConfigService,
    route: ActivatedRoute,
    api: WorkspaceService,
    private router: Router,
    private hub: NotificationService
  ) {

    const query$ = (id: string) => zip(
      api.load(id).pipe(
        catchError(err => {
          this.err = err;
          config.updateLocal({last: ''});
          return of({} as Workspace);
        })
      ),
      api.getStats(id).pipe(
        catchError(err => of({} as WorkspaceStats))
      ),
    ).pipe(
      map(([workspace, stats]) => {
        workspace.stats = stats;
        return workspace;
      })
    );

    this.summary = route.params.pipe(
      tap(p => this.section = p.section),
      map(p => p.id),
      debounceTime(500),
      distinctUntilChanged(),
      tap(id => this.guid = id),
      switchMap(id => query$(id)),
      filter(r => !!r.id),
      tap(r => hub.joinChannel(r.id)),
      tap(r => config.updateLocal({last: `topo/${r.id}/${this.section}`}))
    );

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.hub.leaveChannel();
  }

  bail(): void {
    this.router.navigateByUrl('/');
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    // console.log(ev);
    if (!this.guid) { return true; }

    let section = '';

    if (ev.ctrlKey) {
      switch (ev.code) {
        case 'Digit1':
          section = 'settings';
          break;
        case 'Digit2':
          section = 'templates';
          break;
        case 'Digit3':
          section = 'document';
          break;
        case 'Digit4':
          section = 'challenge';
          break;
        case 'Digit5':
          section = 'files';
          break;
        case 'Digit6':
          section = 'play';
          break;
      }
    }

    if (this.guid && section) {
      this.router.navigate(['topo', this.guid, section]);
      return false;
    }

    return true;
  }
}
