// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { faCheck, faCheckSquare, faFilter, faList, faSearch, faSquare, faSyncAlt, faTrash, faSortUp, faSortDown, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { BehaviorSubject, combineLatest, interval, merge, Observable, of } from 'rxjs';
import { debounceTime, filter, map, switchMap, tap, catchError } from 'rxjs/operators';
import { GamespaceService } from '../../api/gamespace.service';
import { Gamespace, Search, Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';

@Component({
    selector: 'app-gamespace-browser',
    templateUrl: './gamespace-browser.component.html',
    styleUrls: ['./gamespace-browser.component.scss'],
    standalone: false
})
export class GamespaceBrowserComponent implements OnInit {
  @Input() fullAdminView = false;
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<Gamespace[]>;
  source: Gamespace[] = [];
  selected: Gamespace[] = [];
  viewed: Gamespace | undefined = undefined;
  view$: Observable<{ g: any, v: Vm[]}>;
  viewChange$ = new BehaviorSubject<Gamespace | undefined>(this.viewed);
  selectAllValue = false;
  search: Search = { term: '', filter: ['all', 'active']};
  term = '';
  filter = 'active';
  skip = 0;
  take = 100;
  count = 0;

  faChecked = faCheckSquare;
  faUnChecked = faSquare;
  faTrash = faTrash;
  faCheck = faCheck;
  faSync = faSyncAlt;
  faList = faList;
  faSearch = faSearch;
  faFilter = faFilter;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faStarSolid = faStarSolid;
  faStarRegular = faStarRegular;

  sortAscending = true;
  sortField: 'id' | 'session' | 'managerWorkspace' = 'session';

  private gamespaceFavorites = new Set<string>();

  constructor(
    private api: GamespaceService,
    vmSvc: VmService
  ) {
    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      tap(r => r.forEach(g => g.checked = !!this.selected.find(s => s.id === g.id))),
      tap(r => this.source = r),
      tap(r => this.count = r.length),
      tap(() => this.applySort()),
      tap(() => this.review()),
    );

    const detail$ = (id: string) => combineLatest([
      api.challenge(id),
      vmSvc.list(id)
    ]).pipe(
      map(([g, v]) => ({ g, v}))
    );

    this.view$ = this.viewChange$.pipe(
      filter(g => !!g),
      switchMap(g => detail$(g?.id || ''))
    );
  }

  ngOnInit(): void {
    this.api.syncGamespaceFavorites().subscribe();

    this.api.gamespaceFavorites$.subscribe(set => {
      this.gamespaceFavorites = set;
      this.applySort();
    });
  }

  refresh(): void {
    this.search.skip = this.skip;
    this.search.take = this.take;
    this.refresh$.next(true);
  }

  termed(): void {
    this.skip = 0;
    this.refresh();
  }

  paged(s: number): void {
    this.skip = s;
    this.refresh();
  }

  view(g: Gamespace): void {
    this.viewed = this.viewed !== g ? g : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.id === this.viewed?.id);
  }

  delete(g: Gamespace): void {
    this.api.delete(g.id).subscribe(() => this.removeDeleted(g));
  }

  toggleFilter(f: string): void {
    this.filter = f;
    this.search.filter = ['all', f];
    this.skip = 0;
    this.refresh();
  }

  toggleAll(): void {
    this.selectAllValue = !this.selectAllValue;
    this.source.forEach(g => g.checked = this.selectAllValue);
    this.selected = this.selectAllValue
      ? this.selected = [...this.source]
      : [];
  }

  deleteSelected(): void {
    [...this.selected].forEach(g => this.delete(g));
  }

  toggle(g: Gamespace): void {

    const found = this.selected.find(f => f.id === g.id);
    if (found) {
      this.selected.splice(
        this.selected.indexOf(found),
        1
      );
    } else {
      this.selected.push(g);
    }
    g.checked = !g.checked;
  }

  private removeDeleted(g: Gamespace): void {
    const found = this.source.find(f => f.id === g.id);
    if (found) {
      this.source.splice(
        this.source.indexOf(found),
        1
      );
    }
  }

  trackById(index: number, g: Gamespace): string {
    return g.id;
  }

  canFavorite(g: Gamespace): boolean {
    return this.filter === 'active' && !!(g as any).startTime;
  }

  isGamespaceFavorite(id: string): boolean {
    return this.gamespaceFavorites.has(id);
  }

  toggleGamespaceFavorite(g: Gamespace, ev?: MouseEvent): void {
    ev?.preventDefault();
    ev?.stopPropagation();

    if (!this.canFavorite(g)) return;

    const id = g.id;
    const currentlyFav = this.gamespaceFavorites.has(id);

    currentlyFav ? this.gamespaceFavorites.delete(id) : this.gamespaceFavorites.add(id);
    this.applySort();

    const req$ = currentlyFav
      ? this.api.unfavoriteGamespace(id)
      : this.api.favoriteGamespace(id);

    req$.pipe(
      catchError(err => {
        currentlyFav ? this.gamespaceFavorites.add(id) : this.gamespaceFavorites.delete(id);
        this.applySort();
        throw err;
      })
    ).subscribe({
      next: () => {
        this.api
          .listGamespaceFavorites()
          .pipe(catchError(() => of([] as string[])))
          .subscribe(ids => {
            this.gamespaceFavorites = new Set(ids);
            this.applySort();
          });
      }
    });
  }

  sortBy(field: 'id' | 'session' | 'managerWorkspace'): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = field !== 'id';
    }
    this.applySort();
  }

  private applySort(): void {
    const dir = this.sortAscending ? 1 : -1;

    this.source.sort((a, b) => {
      if (this.filter === 'active') {
        const aFav = this.canFavorite(a) && this.gamespaceFavorites.has(a.id) ? 1 : 0;
        const bFav = this.canFavorite(b) && this.gamespaceFavorites.has(b.id) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
      }

      let av: any;
      let bv: any;

      if (this.sortField === 'id') {
        av = (a.id || '').toLowerCase();
        bv = (b.id || '').toLowerCase();
      } else if (this.sortField === 'session') {
        av = Number((a as any)?.session?.countdown ?? 0);
        bv = Number((b as any)?.session?.countdown ?? 0);
      } else {
        av = `${(a.managerName || '').toLowerCase()}|${(a.name || '').toLowerCase()}`;
        bv = `${(b.managerName || '').toLowerCase()}|${(b.name || '').toLowerCase()}`;
      }

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }
}
