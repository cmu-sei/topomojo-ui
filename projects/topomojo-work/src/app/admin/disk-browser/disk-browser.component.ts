// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { faFilter, faSearch, faSortDown, faSortUp, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { catchError, map, scan, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { AdminService, TemplateSource, TemplateSourceReport } from '../../api/admin.service';

type SortColumn = 'name' | 'workspace' | 'date';

// While a refresh loads, the last report stays on screen. A failed load replaces it with the error.
type DiskBrowserState = { loading: boolean; report?: TemplateSourceReport; error?: string };

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
  skip = 0;
  take = 100;
  view$ = new BehaviorSubject<boolean>(true);

  state$: Observable<DiskBrowserState>;
  rows$: Observable<TemplateSource[]>;

  faSearch = faSearch;
  faFilter = faFilter;
  faSync = faSyncAlt;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

  constructor(api: AdminService) {
    this.state$ = this.refresh$.pipe(
      switchMap(() => api.getTemplateSources().pipe(
        map((report): DiskBrowserState => ({ loading: false, report })),
        catchError((err: HttpErrorResponse) => of<DiskBrowserState>({ loading: false, error: this.errorText(err) })),
        startWith<DiskBrowserState>({ loading: true })
      )),
      scan((prev: DiskBrowserState, next: DiskBrowserState) => next.loading
        ? { loading: true, report: prev.report }
        : next, { loading: true }),
      shareReplay(1)
    );
    this.rows$ = combineLatest([this.state$, this.view$]).pipe(
      map(([state]) => state.report ? this.sorted(this.filtered(state.report.sources)) : [])
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

  // the search, filter or sort changed: start again from the first page
  changed(): void {
    this.skip = 0;
    this.view$.next(true);
  }

  paged(skip: number): void {
    this.skip = skip;
    this.view$.next(true);
  }

  // rows on the current page, which is what the pager counts
  pageCount(rows: TemplateSource[]): number {
    return Math.max(0, Math.min(this.take, rows.length - this.skip));
  }

  sortBy(column: SortColumn): void {
    this.sortAscending = this.sortColumn === column ? !this.sortAscending : true;
    this.sortColumn = column;
    this.changed();
  }

  private errorText(err: HttpErrorResponse): string {
    if (err.status === 404) {
      return 'This TopoMojo API doesn\'t list disks or template VMs. Upgrade the API to use the Disks tab.';
    }
    if (err.status === 0) {
      return 'TopoMojo\'s API couldn\'t be reached. Check that it\'s running, then Refresh.';
    }
    // a 400 carries the API's explanation; anything else gets a bare "Error" from the API
    const message = err.error?.message;
    return message && message !== 'Error'
      ? message
      : `The list could not be loaded (HTTP ${err.status}).`;
  }

  private filtered(sources: TemplateSource[]): TemplateSource[] {
    const t = this.term.trim().toLowerCase();
    return sources
      .filter(s => !this.globalOnly || s.isGlobal)
      .filter(s => !t || [s.name, s.workspaceName, s.templateName]
        .some(v => (v || '').toLowerCase().includes(t)));
  }

  private sorted(sources: TemplateSource[]): TemplateSource[] {
    const dir = this.sortAscending ? 1 : -1;
    const text = (v?: string) => (v || '').toLowerCase();
    const time = (s: TemplateSource) => {
      const value = this.dateOf(s);
      return value ? Date.parse(value) : NaN;
    };
    const compare = (a: TemplateSource, b: TemplateSource): number => {
      switch (this.sortColumn) {
        // global first in either direction, like the Files page
        case 'workspace':
          return Number(b.isGlobal) - Number(a.isGlobal)
            || dir * text(a.workspaceName || a.workspaceId).localeCompare(text(b.workspaceName || b.workspaceId));
        // undated last in either direction
        case 'date': {
          const ta = time(a), tb = time(b);
          if (isNaN(ta) || isNaN(tb)) {
            return Number(isNaN(ta)) - Number(isNaN(tb));
          }
          return dir * (ta - tb);
        }
        default:
          return dir * text(a.name).localeCompare(text(b.name));
      }
    };
    return [...sources].sort(compare);
  }
}
