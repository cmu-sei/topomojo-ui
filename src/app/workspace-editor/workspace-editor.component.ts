// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { Workspace, WorkspaceSummary } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { ClipboardService } from '../clipboard.service';
import { Actor, NotificationService } from '../notification.service';

@Component({
  selector: 'app-workspace-editor',
  templateUrl: './workspace-editor.component.html',
  styleUrls: ['./workspace-editor.component.scss']
})
export class WorkspaceEditorComponent implements OnInit, OnDestroy {

  summary: Observable<Workspace>;
  section = 'settings';

  constructor(
    route: ActivatedRoute,
    api: WorkspaceService,
    private hub: NotificationService
  ) {

    this.summary = route.params.pipe(
      tap(p => this.section = p.section),
      map(p => p.id),
      debounceTime(500),
      distinctUntilChanged(),
      tap(id => hub.joinWorkspace(id)),
      switchMap(id => api.load(id))
    );

  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.hub.leaveWorkspace();
  }

}
