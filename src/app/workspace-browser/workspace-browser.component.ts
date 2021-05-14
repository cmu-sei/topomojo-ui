// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { WorkspaceSummary } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  styleUrls: ['./workspace-browser.component.scss']
})
export class WorkspaceBrowserComponent implements OnInit {

  workspaces: Observable<WorkspaceSummary[]>;
  term = new BehaviorSubject<Event>(new Event('change'));

  constructor(
    private auth: AuthService,
    private api: WorkspaceService,
    private router: Router
  ) {
    this.workspaces = this.term.pipe(
      map((e: Event) => (e.target as HTMLInputElement || {}).value),
      debounceTime(150),
      distinctUntilChanged(),
      switchMap(term => this.api.list({term})),
      tap(data => this.select(data))
    );
  }

  ngOnInit(): void {
  }

  select(data: WorkspaceSummary[]): void {
    if (data.length === 1) {
      this.router.navigate(['/topo', data[0].globalId, 'settings']);
    }
  }

}
