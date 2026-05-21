// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  faCircleNotch,
  faCompactDisc,
  faTrash,
  faFilter,
  faSyncAlt,
  faSortUp,
  faSortDown,
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, Subject, Subscription, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { IsoDataFilter, IsoFile, IsoUsageReport } from '../api/gen/models';
import { GLOBAL_WORKSPACE_ID } from '../constants';
import { AdminService } from '../api/admin.service';
import { WorkspaceService } from '../api/workspace.service';
import { ModalService } from '../services/modal.service';

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
  standalone: false,
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
  loading = false;
  filterLocal = true;
  term = '';
  sortColumn: 'name' | 'workspace' = 'name';
  sortAscending = true;
  skip = 0;
  take = 100;
  count = 0;
  private allFiles: IsoFileDisplay[] = [];
  private subscription: Subscription;
  private destroy$ = new Subject<void>();

  @ViewChild('deleteModal') deleteModal!: TemplateRef<any>;
  usageReport: IsoUsageReport | null = null;
  pendingDeleteFile: IsoFileDisplay | null = null;
  deletingFile: IsoFileDisplay | null = null;
  deleteError = '';

  faCircleNotch = faCircleNotch;
  faCompactDisc = faCompactDisc;
  faFilter = faFilter;
  faSync = faSyncAlt;
  faTrash = faTrash;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

  private adminIsoCache: IsoFile[] | null = null;

  constructor(
    private workspaceSvc: WorkspaceService,
    private adminSvc: AdminService,
    private modalSvc: ModalService,
  ) {
    this.subscription = this.refresh$
      .pipe(
        debounceTime(500),
        tap(() => this.loading = true),
        switchMap((model) =>
          this.showWorkspaceContext
            ? this.getAdminIsos(model.refresh)
            : this.workspaceSvc.getIsos(this.guid, model)
        ),
        map((files) => files.map((f) => this.parseIsoFile(f))),
        map((files) =>
          this.showWorkspaceContext && this.filterLocal
            ? files.filter((f) => f.isGlobal)
            : files
        ),
        map((files) =>
          this.term
            ? files.filter((f) => f.filename.toLowerCase().includes(this.term.toLowerCase()))
            : files
        ),
        switchMap((files) => this.enrichWithWorkspaceNames(files)),
      )
      .subscribe((files) => {
        this.allFiles = files;
        this.loading = false;
        this.applySort();
      });
  }

  private getAdminIsos(refresh?: boolean): Observable<IsoFile[]> {
    if (this.adminIsoCache && !refresh) {
      return of(this.adminIsoCache);
    }
    return this.adminSvc.getAllIsos().pipe(
      tap((files) => this.adminIsoCache = files)
    );
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.guid) {
      this.refresh();
    }
  }

  refresh(force: boolean = false): void {
    this.skip = 0;
    this.refresh$.next({
      term: this.term,
      local: this.filterLocal,
      refresh: force,
    });
  }

  select(file: IsoFile): void {
    this.added.emit(file);
  }

  attemptDelete(file: IsoFileDisplay): void {
    this.pendingDeleteFile = file;
    this.deletingFile = file;
    this.usageReport = null;
    this.deleteError = '';

    this.workspaceSvc.checkIsoUsage(this.guid, file.path).pipe(takeUntil(this.destroy$)).subscribe({
      next: (report) => {
        this.deletingFile = null;
        if (!report.templates.length && !report.activeGamespaces.length) {
          this.confirmDelete();
        } else {
          this.usageReport = report;
          this.modalSvc.openTemplate(this.deleteModal);
        }
      },
      error: () => {
        this.deletingFile = null;
        this.confirmDelete();
      },
    });
  }

  confirmDelete(): void {
    if (!this.pendingDeleteFile) return;
    const file = this.pendingDeleteFile;
    this.modalSvc.dismiss();
    this.workspaceSvc.deleteIso(this.guid, file.path).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.refresh(true);
        this.deleted.emit(file);
      },
      error: (err) => {
        this.deleteError = err?.error?.message || err?.message || 'Failed to delete ISO';
      },
    });
    this.pendingDeleteFile = null;
  }

  cancelDelete(): void {
    this.modalSvc.dismiss();
    this.pendingDeleteFile = null;
  }

  parseIsoFile(file: IsoFile): IsoFileDisplay {
    const parts = file.path.split('/');
    const workspaceId = parts.length > 1 ? parts[0] : this.guid;
    const filename = parts.length > 1 ? parts[1] : parts[0];

    return {
      ...file,
      filename: filename,
      workspaceId: workspaceId,
      isGlobal: workspaceId === GLOBAL_WORKSPACE_ID,
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
    this.allFiles.sort((a, b) => {
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
    this.applyPaging();
  }

  private applyPaging(): void {
    this.files = this.allFiles.slice(this.skip, this.skip + this.take);
    this.count = this.files.length;
  }

  paged(skip: number): void {
    this.skip = skip;
    this.applyPaging();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private wsNames = new Map<string, string>();

  enrichWithWorkspaceNames(
    files: IsoFileDisplay[],
  ): Observable<IsoFileDisplay[]> {
    if (!this.showWorkspaceContext) {
      return of(files);
    }

    const uncachedIds = files
      .filter((f) => !f.isGlobal && !this.wsNames.has(f.workspaceId))
      .map((f) => f.workspaceId);

    const names$ =
      uncachedIds.length > 0
        ? this.workspaceSvc.list({ term: '', take: 0, skip: 0 }).pipe(
            tap((list) => {
              list.forEach((ws) => this.wsNames.set(ws.id, ws.name));
              uncachedIds.forEach((id) => {
                if (!this.wsNames.has(id)) this.wsNames.set(id, '(deleted)');
              });
            }),
            catchError(() => of([])),
          )
        : of([]);

    return names$.pipe(
      map(() =>
        files.map((f) => ({
          ...f,
          workspaceName: f.isGlobal
            ? 'Global'
            : this.wsNames.get(f.workspaceId) || '(deleted)',
        })),
      ),
    );
  }
}
