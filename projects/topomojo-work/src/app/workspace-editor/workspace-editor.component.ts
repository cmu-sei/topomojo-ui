// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { Workspace } from '../api/gen/models';
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

  constructor(
    config: ConfigService,
    route: ActivatedRoute,
    api: WorkspaceService,
    private router: Router,
    private hub: NotificationService
  ) {

    this.summary = route.params.pipe(
      tap(p => this.section = p.section),
      map(p => p.id),
      debounceTime(500),
      distinctUntilChanged(),
      tap(id => this.guid = id),
      tap(id => hub.joinWorkspace(id)),
      switchMap(id => api.load(id)),
      tap(w => config.updateLocal({last: `topo/${w.globalId}/${this.section}`}))
    );

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.hub.leaveWorkspace();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    // console.log(ev);
    if (!this.guid) { return true; }

    let section = '';

    if (ev.ctrlKey) {
      switch (ev.code) {
        case 'Digit1':
        case 'KeyS':
          section = 'settings';
          break;
        case 'Digit2':
        case 'KeyT':
          section = 'templates';
          break;
        case 'Digit3':
        case 'KeyD':
          section = 'document';
          break;
        case 'Digit4':
        case 'KeyC':
          section = 'challenge';
          break;
        case 'Digit5':
        case 'KeyF':
          section = 'files';
          break;
        case 'Digit6':
        case 'KeyP':
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
