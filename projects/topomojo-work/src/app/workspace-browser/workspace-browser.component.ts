// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { faFilter, faSyncAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, of, zip, combineLatest } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap, shareReplay, startWith } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { Gamespace, Search, WorkspaceSummary } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  standalone: false
})
export class WorkspaceBrowserComponent implements OnInit {
  @ViewChild('searchterm') searchterm!: ElementRef;

  workspaces: Observable<WorkspaceSummary[]>;
  gamespaces: Observable<Gamespace[]>;

  refresh$ = new BehaviorSubject<boolean>(true);

  search: Search = { term: '', take: 100, filter: ['all', 'active'] };
  skip = 0;
  take = 100;
  count = 0;
  mode = 'workspace';

  faFilter = faFilter;
  faSync = faSyncAlt;
  faInfoCircle = faInfoCircle;

  private workspaceFavorites = new Set<string>();

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

    const workspaceList$ = this.refresh$.pipe(
      debounceTime(150),
      switchMap(() => this.api.list({ ...this.search, filter: ['my'] })),
      shareReplay(1)
    );

    const workspaceFavs$ = this.api.workspaceFavorites$.pipe(
      startWith(new Set<string>())
    );

    this.workspaces = combineLatest([workspaceList$, workspaceFavs$]).pipe(
      map(([list, favs]) => this.sortWorkspaces(list, favs)),
      tap(list => (this.count = list.length))
    );

    const gamespaceList$ = this.refresh$.pipe(
      debounceTime(150),
      switchMap(() =>
        zip(
          this.gsapi.list({ ...this.search, filter: ['active'] }),
          this.api.list({ ...this.search, filter: ['play'] })
        )
      ),
      map(([gs, ws]) => [...gs, ...(ws as unknown as Gamespace[])]),
      shareReplay(1)
    );

    this.gamespaces = combineLatest([gamespaceList$, workspaceFavs$]).pipe(
      map(([list, favs]) => this.sortGamespaces(list, favs)),
      tap(list => (this.count = list.length)),
      tap(() => this.config.updateLocal({ browseTerm: this.search.term }))
    );
  }

  ngOnInit(): void {
    this.api.syncWorkspaceFavorites().subscribe();

    this.api.workspaceFavorites$.subscribe(set => {
      this.workspaceFavorites = set;
      this.refresh$.next(true);
    });
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
    this.config.updateLocal({ browseMode: mode });
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

  isFavorite(id: string): boolean {
    return this.workspaceFavorites.has(id);
  }

  toggleFavorite(id: string): void {
    this.toggleIdFavorite({
      id,
      set: this.workspaceFavorites,
      favorite: () => this.api.favoriteWorkspace(id),
      unfavorite: () => this.api.unfavoriteWorkspace(id),
      resync: undefined
    });
  }

  private isActiveGamespace(g: Gamespace): boolean {
    return !!(g as any).startTime;
  }

  isPlayableGamespace(g: Gamespace): boolean {
    return !this.isActiveGamespace(g);
  }


  toggleGamespaceFavorite(g: Gamespace): void {
    if (!this.isPlayableGamespace(g)) return;
    this.toggleFavorite(g.id); // workspace favorites
  }

  private sortWorkspaces(list: WorkspaceSummary[], favs: Set<string>): WorkspaceSummary[] {
    return [...list].sort((a, b) => {
      const af = favs.has(a.id) ? 1 : 0;
      const bf = favs.has(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  private sortGamespaces(list: Gamespace[], favs: Set<string>): Gamespace[] {
    return [...list].sort((a, b) => {
      const aActive = this.isActiveGamespace(a);
      const bActive = this.isActiveGamespace(b);

      if (aActive !== bActive) return aActive ? -1 : 1;

      if (!aActive && !bActive) {
        const af = favs.has(a.id) ? 1 : 0;
        const bf = favs.has(b.id) ? 1 : 0;
        if (af !== bf) return bf - af;
      }

      return (a.name || '').localeCompare(b.name || '');
    });
  }

  private toggleIdFavorite(opts: {
    id: string;
    set: Set<string>;
    favorite: () => Observable<any>;
    unfavorite: () => Observable<any>;
    resync?: () => void;
  }): void {
    const { id, set, favorite, unfavorite, resync } = opts;
    const currentlyFav = set.has(id);

    currentlyFav ? set.delete(id) : set.add(id);
    this.refresh$.next(true);

    const req$ = currentlyFav ? unfavorite() : favorite();

    req$.subscribe({
      next: () => resync?.(),
      error: () => {
        currentlyFav ? set.add(id) : set.delete(id);
        this.refresh$.next(true);
      }
    });
  }
}
