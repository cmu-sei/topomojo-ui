// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faSearch, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, switchMap, tap, map } from 'rxjs/operators';
import { Search, Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';

@Component({
  selector: 'app-vm-browser',
  templateUrl: './vm-browser.component.html',
  styleUrls: ['./vm-browser.component.scss'],
  standalone: false
})
export class VmBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<Vm[]>;
  source: Vm[] = [];
  search: Search = { term: '', take: 100 };

  faSearch = faSearch;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

  sortAscending = true;
  sortField: 'name' | 'group' | 'host' = 'name';

  constructor(private api: VmService) {
    this.source$ = this.refresh$.pipe(
      debounceTime(300),
      switchMap(() => this.api.list('')),
      map(vms => this.filterVms(vms, this.search.term)),
      tap(r => {
        this.source = r;
        this.applySort();
      }),
      map(() => this.source)
    );
  }


  ngOnInit(): void {}

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

  trackById(index: number, vm: Vm): string {
    return vm.id || '';
  }

  sortBy(field: 'name' | 'group' | 'host'): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = true;
    }
    this.applySort();
  }

  private applySort(): void {
    const dir = this.sortAscending ? 1 : -1;

    const hostShort = (vm: Vm) => (vm.host ? vm.host.split('.').shift() : '');

    const value = (vm: Vm) => {
      switch (this.sortField) {
        case 'group':
          return (vm.groupName || '').toLowerCase();
        case 'host':
          return (hostShort(vm) || '').toLowerCase();
        default:
          return (vm.name || '').toLowerCase();
      }
    };

    this.source.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return (a.id || '').localeCompare(b.id || '');
    });
  }

}
