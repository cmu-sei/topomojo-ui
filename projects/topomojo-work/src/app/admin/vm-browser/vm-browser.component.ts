// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { Search, Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';

@Component({
  selector: 'app-vm-browser',
  templateUrl: './vm-browser.component.html',
  styleUrls: ['./vm-browser.component.scss']
})
export class VmBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<Vm[]>;
  source: Vm[] = [];
  // selected: Vm[] = [];
  // viewed: Vm | undefined = undefined;
  // viewChange$ = new BehaviorSubject<Vm | undefined>(this.viewed);
  search: Search = { term: '', take: 100};

  faSearch = faSearch;

  constructor(
    private api: VmService
  ) {
    this.source$ = this.refresh$.pipe(
      debounceTime(500),
      switchMap(() => api.list(this.search.term || '')),
      tap(r => this.source = r)
    );
  }

  ngOnInit(): void {
  }

  trackById(index: number, vm: Vm): string {
    return vm.id || '';
  }
}
