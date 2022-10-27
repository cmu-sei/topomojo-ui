// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faCheckSquare, faSquare, faTrash, faCheck, faSyncAlt, faList, faSearch } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { Search, Workspace, WorkspaceSummary } from '../../api/gen/models';
import { WorkspaceService } from '../../api/workspace.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  styleUrls: ['./workspace-browser.component.scss']
})
export class WorkspaceBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<WorkspaceSummary[]>;
  source: WorkspaceSummary[] = [];
  selected: WorkspaceSummary[] = [];
  viewed: WorkspaceSummary | undefined = undefined;
  viewChange$ = new BehaviorSubject<WorkspaceSummary | undefined>(this.viewed);
  detail$: Observable<Workspace>;
  search: Search = { term: '', skip: 0, take: 100};
  skip = 0;
  take = 100;
  count = 0;

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;

  constructor(
    private api: WorkspaceService,
  ) {
    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      // tap(r => r.forEach(g => g.checked = !!this.selected.find(s => s.id === g.id))),
      tap(r => this.source = r),
      tap(r => this.count = r.length),
      tap(() => this.review()),
    );

    this.detail$ = this.viewChange$.pipe(
      filter(g => !!g),
      switchMap(g => api.load(g?.id || ''))
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.search.skip = this.skip;
    this.search.take = this.take;
    this.refresh$.next(true);
  }

  paged(s: number): void {
    this.skip = s;
    this.refresh();
  }

  termed(): void {
    this.skip = 0;
    this.refresh();
  }

  view(w: WorkspaceSummary): void {
    this.viewed = this.viewed !== w ? w : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.id === this.viewed?.id);
  }

  delete(w: WorkspaceSummary): void {
    this.api.delete(w.id).subscribe(() => {
      const found = this.source.find(f => f.id === w.id);
      if (found) {
        this.source.splice(
          this.source.indexOf(found),
          1
        );
      }
    });

  }

  update(w: Workspace): void {
    this.api.privilegedUpdate(w).subscribe();
  }

  trackById(index: number, g: WorkspaceSummary): string {
    return g.id;
  }
}
