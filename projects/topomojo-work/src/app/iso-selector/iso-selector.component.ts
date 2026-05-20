// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { faArrowDown, faCheck, faCompactDisc, faFile, faPlus, faTrash, faFilter, faSyncAlt, faSync, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, Subject, Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, filter, finalize, map, mergeMap, switchMap, tap, catchError } from 'rxjs/operators';
import { ApiSettings } from '../api/api-settings';
import { FileService } from '../api/file.service';
import { IsoDataFilter, IsoFile } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { ClipboardService } from '../clipboard.service';

export interface IsoFileDisplay extends IsoFile {
  filename: string;
  workspaceId: string;
  workspaceName?: string;
  isGlobal: boolean;
}

@Component({
    selector: 'app-iso-selector',
    templateUrl: './iso-selector.component.html',
    styleUrls: ['./iso-selector.component.scss'],
    standalone: false
})
export class IsoSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() guid = '';
  @Input() collapsed = false;
  @Input() canDelete = false;
  @Input() showWorkspaceContext = false;
  @Output() added = new EventEmitter<IsoFile>();
  @Output() deleted = new EventEmitter<IsoFile>();
  refresh$ = new BehaviorSubject<IsoDataFilter>({});
  files: IsoFileDisplay[] = [];
  filterLocal = true;
  term = '';
  sortColumn: 'name' | 'workspace' = 'name';
  sortAscending = true;
  private subscription: Subscription;

  faCompactDisc = faCompactDisc;
  faCheck = faCheck;
  faFile = faFile;
  faFilter = faFilter;
  faSync = faSyncAlt;
  faTrash = faTrash;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

  constructor(
    private workspaceSvc: WorkspaceService
  ) {

    this.subscription = this.refresh$.pipe(
      debounceTime(500),
      switchMap(model => this.workspaceSvc.getIsos(this.guid, model)),
      map(files => files.map(f => this.parseIsoFile(f))),
      switchMap(files => this.enrichWithWorkspaceNames(files)),
    ).subscribe(files => {
      this.files = files;
      this.applySort();
    });

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.guid) {
      this.refresh();
    }
  }

  refresh(force: boolean = false): void {
    this.refresh$.next({ term: this.term, local: this.filterLocal, refresh: force});
  }

  select(file: IsoFile): void {
    this.added.emit(file);
  }

  deleteIso(file: IsoFileDisplay): void {
    this.workspaceSvc.deleteIso(this.guid, file.path).subscribe({
      next: () => {
        this.refresh(true);
        this.deleted.emit(file);
      },
      error: (err) => {
        console.error('Failed to delete ISO:', err);
      }
    });
  }

  parseIsoFile(file: IsoFile): IsoFileDisplay {
    const parts = file.path.split('/');
    const workspaceId = parts.length > 1 ? parts[0] : this.guid;
    const filename = parts.length > 1 ? parts[1] : parts[0];

    return {
      ...file,
      filename: filename,
      workspaceId: workspaceId,
      isGlobal: workspaceId === '00000000-0000-0000-0000-000000000000'
    };
  }

  sortBy(column: 'name' | 'workspace'): void {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = true;
    }
    this.applySort();
  }

  private applySort(): void {
    this.files.sort((a, b) => {
      let comparison = 0;
      if (this.sortColumn === 'name') {
        comparison = a.filename.localeCompare(b.filename);
      } else {
        const aW = a.workspaceName || a.workspaceId;
        const bW = b.workspaceName || b.workspaceId;
        comparison = aW.localeCompare(bW);
      }
      return this.sortAscending ? comparison : -comparison;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  enrichWithWorkspaceNames(files: IsoFileDisplay[]): Observable<IsoFileDisplay[]> {
    if (!this.showWorkspaceContext) {
      return of(files);
    }

    const workspaceIds = [...new Set(
      files
        .filter(f => !f.isGlobal)
        .map(f => f.workspaceId)
    )];

    if (workspaceIds.length === 0) {
      return of(files);
    }

    return forkJoin(
      workspaceIds.map(id =>
        this.workspaceSvc.load(id).pipe(
          map(ws => ({ id, name: ws.name })),
          catchError((err) => {
            console.warn(`Failed to load workspace ${id}:`, err);
            return of({ id, name: '(deleted)' });
          })
        )
      )
    ).pipe(
      map(workspaces => {
        const wsMap = new Map(workspaces.map(ws => [ws.id, ws.name]));
        return files.map(f => ({
          ...f,
          workspaceName: f.isGlobal ? 'Global' : (wsMap.get(f.workspaceId) || '(unknown)')
        }));
      }),
      catchError((err) => {
        console.error('Failed to enrich workspace names:', err);
        return of(files.map(f => ({
          ...f,
          workspaceName: f.isGlobal ? 'Global' : '(unknown)'
        })));
      })
    );
  }

}
