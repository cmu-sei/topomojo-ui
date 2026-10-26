// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component } from '@angular/core';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { AdminService, TemplateSourceOptions } from '../../api/admin.service';

@Component({
  selector: 'app-disk-browser',
  templateUrl: './disk-browser.component.html',
  styleUrls: ['./disk-browser.component.scss'],
  standalone: false
})
export class DiskBrowserComponent {
  term$ = new BehaviorSubject<string>('');
  sources$: Observable<TemplateSourceOptions>;
  filtered$: Observable<string[]>;
  faSearch = faSearch;

  constructor(api: AdminService) {
    this.sources$ = api.getTemplateSources().pipe(shareReplay(1));
    this.filtered$ = combineLatest([this.sources$, this.term$]).pipe(
      map(([sources, term]) => {
        const t = term.trim().toLowerCase();
        return t ? sources.names.filter(n => n.toLowerCase().includes(t)) : sources.names;
      })
    );
  }
}
