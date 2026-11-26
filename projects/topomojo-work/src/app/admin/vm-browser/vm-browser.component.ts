// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnDestroy, OnInit } from '@angular/core';
import { faSearch, faSortUp, faSortDown, faInfoCircle, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { switchMap, tap, map, finalize } from 'rxjs/operators';
import { Search, Vm, VmStateEnum } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';

interface VmWithParsedGroup extends Vm {
  parsedGroup: { type: 'workspace' | 'gamespace' | 'orphaned', name: string, id: string };
}

@Component({
  selector: 'app-vm-browser',
  templateUrl: './vm-browser.component.html',
  styleUrls: ['./vm-browser.component.scss'],
  standalone: false
})
export class VmBrowserComponent implements OnInit, OnDestroy {
  // refresh$ asks the API for the list again; view$ re-filters, re-sorts and re-pages what is already loaded.
  refresh$ = new BehaviorSubject<boolean>(true);
  view$ = new BehaviorSubject<boolean>(true);
  source$: Observable<VmWithParsedGroup[]>;
  rows: VmWithParsedGroup[] = [];
  vms: Vm[] = [];
  private subscription?: Subscription;
  loading = false;
  search: Search = { term: '' };
  skip = 0;
  take = 100;
  count = 0;
  matched = 0;

  faSearch = faSearch;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faInfoCircle = faInfoCircle;
  faSync = faSyncAlt;
  VmStateEnum = VmStateEnum;

  sortAscending = true;
  sortField: 'name' | 'group' | 'state' | 'host' = 'name';

  constructor(private api: VmService) {
    const loaded$ = this.refresh$.pipe(
      tap(() => this.loading = true),
      switchMap(() => this.api.list('').pipe(finalize(() => this.loading = false))),
      tap(vms => this.vms = vms)
    );

    this.source$ = loaded$.pipe(
      switchMap(() => this.view$),
      map(() => this.pageOfMatches())
    );
  }

  ngOnInit(): void {
    // subscribe here, not with the async pipe: the counts above the list are set while the page is built
    this.subscription = this.source$.subscribe(rows => this.rows = rows);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  // the search term or sort changed: start again from the first page
  changed(): void {
    this.skip = 0;
    this.view$.next(true);
  }

  paged(skip: number): void {
    this.skip = skip;
    this.view$.next(true);
  }

  private pageOfMatches(): VmWithParsedGroup[] {
    const matches: VmWithParsedGroup[] = this.filterVms(this.vms, this.search.term).map(vm => ({
      ...vm,
      parsedGroup: this.parseGroupName(vm.groupName)
    }));
    this.matched = matches.length;
    this.applySort(matches);
    const page = matches.slice(this.skip, this.skip + this.take);
    this.count = page.length;
    return page;
  }

  private filterVms(vms: Vm[], termRaw: string): Vm[] {
    const term = (termRaw || '').trim().toLowerCase();
    if (!term) return [...vms];

    const matches = (value?: string | null) =>
      (value || '').toLowerCase().includes(term);

    return vms.filter(vm => {
      const hostShort = vm.host ? vm.host.split('.').shift() : '';
      return (
        matches(vm.name) ||
        matches(vm.groupName) ||
        matches(vm.host) ||
        matches(hostShort) ||
        matches(vm.id)
      );
    });
  }

  trackById(index: number, vm: VmWithParsedGroup): string {
    return vm.id || '';
  }

  parseGroupName(groupName?: string): { type: 'workspace' | 'gamespace' | 'orphaned', name: string, id: string } {
    if (!groupName) return { type: 'orphaned', name: 'Unknown', id: '' };

    const parts = groupName.split('#');
    if (parts.length !== 2) return { type: 'orphaned', name: groupName, id: '' };

    const [prefix, id] = parts;

    if (prefix === '__orphaned') {
      return { type: 'orphaned', name: 'Orphaned', id };
    }

    if (prefix.startsWith('workspace: ')) {
      return { type: 'workspace', name: prefix.substring(11), id };
    }

    if (prefix.startsWith('gamespace: ')) {
      return { type: 'gamespace', name: prefix.substring(11), id };
    }

    return { type: 'orphaned', name: prefix, id };
  }

  sortBy(field: 'name' | 'group' | 'state' | 'host'): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
    this.changed();
  }

  private applySort(list: VmWithParsedGroup[]): void {
    const dir = this.sortAscending ? 1 : -1;

    const hostShort = (vm: Vm) => (vm.host ? vm.host.split('.').shift() : '');

    const value = (vm: Vm) => {
      switch (this.sortField) {
        case 'group':
          return (vm.groupName || '').toLowerCase();
        case 'state':
          return (vm.state || '').toLowerCase();
        case 'host':
          return (hostShort(vm) || '').toLowerCase();
        default:
          return (vm.name || '').toLowerCase();
      }
    };

    list.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return (a.id || '').localeCompare(b.id || '');
    });
  }

}
