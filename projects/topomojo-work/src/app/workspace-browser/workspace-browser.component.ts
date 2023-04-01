// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { faFilter, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { Observable, BehaviorSubject, zip } from 'rxjs';
import { map, debounceTime, switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { Gamespace, Search, WorkspaceSummary } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  styleUrls: ['./workspace-browser.component.scss']
})
export class WorkspaceBrowserComponent implements OnInit {
  @ViewChild('search') searchterm!: ElementRef;
  workspaces: Observable<WorkspaceSummary[]>;
  gamespaces: Observable<Gamespace[]>;
  refresh$ = new BehaviorSubject<boolean>(true);
  search: Search = { term: '', take: 100, filter: ['all', 'active']};
  skip = 0;
  take = 100;
  count = 0;
  mode = 'workspace';
  faFilter = faFilter;
  faSync = faSyncAlt;

  constructor(
    private auth: AuthService,
    private api: WorkspaceService,
    private gsapi: GamespaceService,
    private router: Router,
    private config: ConfigService
  ) {

    const local = config.getLocal();
    this.mode = local.browseMode || 'workspace';
    this.search.term = local.browseTerm || '';

    this.workspaces = this.refresh$.pipe(
      debounceTime(150),
      // distinctUntilChanged(),
      switchMap(() => this.api.list({...this.search, filter: ['my']})),
      tap(l => this.count = l.length)
    );

    this.gamespaces = this.refresh$.pipe(
      debounceTime(150),
      // distinctUntilChanged(),
      switchMap(() => zip(
        gsapi.list({...this.search, filter: ['active']}),
        api.list({...this.search, filter: ['play']})
      ).pipe(
        map(([gs, ws]) => [...gs, ...(ws as unknown as Gamespace[])]),
        tap(l => this.count = l.length),
        tap(() => this.config.updateLocal({browseTerm: this.search.term}))
      ))
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.search.skip = this.skip;
    this.search.take = this.take;
    this.refresh$.next(true);
  }

  termed(e: Event): void {
    this.skip = 0;
    this.refresh$.next(true);
  }

  paged(s: number): void {
    this.skip = s;
    this.refresh();
  }

  setMode(mode: string): void {
    this.mode = mode;
    this.config.updateLocal({browseMode: mode});
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    if (ev.ctrlKey && ev.code === 'KeyO') {
      this.searchterm.nativeElement.focus();
      this.searchterm.nativeElement.select();
      return false;
    }
    return true;
  }

}
