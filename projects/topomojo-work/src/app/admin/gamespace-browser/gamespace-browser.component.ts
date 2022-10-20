// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { faCheck, faCheckSquare, faFilter, faList, faSearch, faSquare, faSyncAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, combineLatest, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, map, switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../../api/gamespace.service';
import { Gamespace, Search, Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';

@Component({
  selector: 'app-gamespace-browser',
  templateUrl: './gamespace-browser.component.html',
  styleUrls: ['./gamespace-browser.component.scss']
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
  paging = false;

  faChecked = faCheckSquare;
  faUnChecked = faSquare;
  faTrash = faTrash;
  faCheck = faCheck;
  faSync = faSyncAlt;
  faList = faList;
  faSearch = faSearch;
  faFilter = faFilter;

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
      tap(() => this.paging = this.skip > 0 || this.source.length === this.take),
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
  }

  refresh(): void {
    this.search.skip = this.skip;
    this.search.take = this.take;
    this.refresh$.next(true);
  }

  term_changed(): void {
    this.skip = 0;
    this.refresh();
  }

  next(): void {
    this.skip += this.take;
    this.refresh();
  }

  prev(): void {
    this.skip = Math.max(0, this.skip - this.take);
    this.refresh();
  }

  top(): void {
    this.skip = 0;
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
    this.search.skip = 0;
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
}
