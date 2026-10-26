// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component } from '@angular/core';
import { faFilter, faSearch, faSortDown, faSortUp, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { AdminService, TemplateSource, TemplateSourceReport } from '../../api/admin.service';

type SortColumn = 'name' | 'workspace' | 'date';

@Component({
  selector: 'app-disk-browser',
  templateUrl: './disk-browser.component.html',
  styleUrls: ['./disk-browser.component.scss'],
  standalone: false
})
export class DiskBrowserComponent {
  refresh$ = new BehaviorSubject<boolean>(true);
  term = '';
  globalOnly = true;
  sortColumn: SortColumn = 'name';
  sortAscending = true;
  view$ = new BehaviorSubject<boolean>(true);

  report$: Observable<TemplateSourceReport>;
  rows$: Observable<TemplateSource[]>;

  faSearch = faSearch;
  faFilter = faFilter;
  faSync = faSyncAlt;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

  constructor(api: AdminService) {
    this.report$ = this.refresh$.pipe(
      switchMap(() => api.getTemplateSources()),
      shareReplay(1)
    );
    this.rows$ = combineLatest([this.report$, this.view$]).pipe(
      map(([report]) => this.sorted(this.filtered(report.sources)))
    );
  }

  // vSphere reports when a disk was modified; Proxmox, when a template vm was created.
  dateLabel(report: TemplateSourceReport): string {
    return report.field === 'template' ? 'Created' : 'Modified';
  }

  dateOf(s: TemplateSource): string | undefined {
    return s.created ?? s.modified;
  }

  formatDate(value?: string): string {
    return value
      ? new Date(value).toLocaleString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
        })
      : '';
  }

  sortBy(column: SortColumn): void {
    this.sortAscending = this.sortColumn === column ? !this.sortAscending : true;
    this.sortColumn = column;
    this.view$.next(true);
  }

  private filtered(sources: TemplateSource[]): TemplateSource[] {
    const t = this.term.trim().toLowerCase();
    return sources
      .filter(s => !this.globalOnly || s.isGlobal)
      .filter(s => !t || [s.name, s.workspaceName, s.templateName]
        .some(v => (v || '').toLowerCase().includes(t)));
  }

  private sorted(sources: TemplateSource[]): TemplateSource[] {
    const key = (s: TemplateSource): string => {
      switch (this.sortColumn) {
        // global first, like the Files page
        case 'workspace': return s.isGlobal ? '' : (s.workspaceName || s.workspaceId || '').toLowerCase();
        case 'date': return this.dateOf(s) || '';
        default: return s.name.toLowerCase();
      }
    };
    const dir = this.sortAscending ? 1 : -1;
    return [...sources].sort((a, b) => key(a).localeCompare(key(b)) * dir);
  }
}
