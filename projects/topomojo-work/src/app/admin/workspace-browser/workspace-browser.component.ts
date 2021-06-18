import { Component, OnInit } from '@angular/core';
import { faCheckSquare, faSquare, faTrash, faCheck, faSyncAlt, faList, faSearch } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { Search, Workspace, WorkspaceSummary } from '../../api/gen/models';
import { WorkspaceService } from '../../api/workspace.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  styleUrls: ['./workspace-browser.component.scss']
})
export class WorkspaceBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<WorkspaceSummary[]>;
  source: WorkspaceSummary[] = [];
  selected: WorkspaceSummary[] = [];
  viewed: WorkspaceSummary | undefined = undefined;
  viewChange$ = new BehaviorSubject<WorkspaceSummary | undefined>(this.viewed);
  detail$: Observable<Workspace>;
  search: Search = { term: '', take: 100};

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;

  constructor(
    private api: WorkspaceService,
  ) {
    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      // tap(r => r.forEach(g => g.checked = !!this.selected.find(s => s.globalId === g.globalId))),
      tap(r => this.source = r),
      tap(() => this.review()),
    );

    this.detail$ = this.viewChange$.pipe(
      filter(g => !!g),
      switchMap(g => api.load(g?.globalId || ''))
    );
  }

  ngOnInit(): void {
  }

  view(w: WorkspaceSummary): void {
    this.viewed = this.viewed !== w ? w : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.globalId === this.viewed?.globalId);
  }

  delete(w: WorkspaceSummary): void {
    this.api.delete(w.globalId).subscribe(() => {
      const found = this.source.find(f => f.globalId === w.globalId);
      if (found) {
        this.source.splice(
          this.source.indexOf(found),
          1
        );
      }
    });

  }

  update(w: Workspace): void {
    this.api.update(w).subscribe();
  }

  trackById(index: number, g: WorkspaceSummary): string {
    return g.globalId;
  }
}
