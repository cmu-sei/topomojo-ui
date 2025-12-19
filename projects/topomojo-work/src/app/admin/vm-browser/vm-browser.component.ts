// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
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

  constructor(private api: VmService) {
    this.source$ = this.refresh$.pipe(
      debounceTime(300),
      switchMap(() => this.api.list('')),
      map(vms => this.filterVms(vms, this.search.term)),

      tap(r => (this.source = r))
    );
  }

  ngOnInit(): void {}

  private filterVms(vms: Vm[], termRaw: string): Vm[] {
    const term = (termRaw || '').trim().toLowerCase();
    if (!term) {
      return [...vms].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    const matches = (value?: string | null) =>
      (value || '').toLowerCase().includes(term);

    return vms
      .filter(vm => {
        const hostShort = vm.host ? vm.host.split('.').shift() : '';
        return (
          matches(vm.name) ||
          matches(vm.groupName) ||
          matches(vm.host) ||
          matches(hostShort) ||
          matches(vm.id)
        );
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  trackById(index: number, vm: Vm): string {
    return vm.id || '';
  }
}
