// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  faUpload,
  faDownload,
  faTrash,
  faList,
  faSearch,
  faPlus,
  faMinus,
  faTimes,
  faFile,
  faFolder,
} from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { Search, Workspace, WorkspaceSummary } from '../../api/gen/models';
import { WorkspaceService } from '../../api/workspace.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  styleUrls: ['./workspace-browser.component.scss'],
})
export class WorkspaceBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<WorkspaceSummary[]>;
  source: WorkspaceSummary[] = [];
  selected$ = new BehaviorSubject<WorkspaceSummary[]>([]);
  selected: WorkspaceSummary[] = [];
  viewed: WorkspaceSummary | undefined = undefined;
  viewChange$ = new BehaviorSubject<WorkspaceSummary | undefined>(this.viewed);
  detail$: Observable<Workspace>;
  search: Search = { term: '', skip: 0, take: 100 };
  skip = 0;
  take = 100;
  count = 0;
  showCreatePanel = false;
  faPlus = faPlus;
  faMinus = faMinus;
  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;
  faUpload = faUpload;
  faDownload = faDownload;
  faTimes = faTimes;
  faFile = faFile;
  faFolder = faFolder;
  readyToDownload = false;
  isDownloading = false;
  showUpload = false;
  showDownload = false;
  selectDownloads = false;
  @ViewChild('jsonInput') jsonInput!: ElementRef<HTMLInputElement>;
  @ViewChild('zipInput') zipInput!: ElementRef<HTMLInputElement>;

  constructor(private api: WorkspaceService) {
    this.source$ = merge(this.refresh$, interval(60000)).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      // tap(r => r.forEach(g => g.checked = !!this.selected.find(s => s.id === g.id))),
      tap((r) => (this.source = r)),
      tap((r) => (this.count = r.length)),
      tap(() => this.review())
    );

    this.detail$ = this.viewChange$.pipe(
      filter((g) => !!g),
      switchMap((g) => api.load(g?.id || ''))
    );
  }

  ngOnInit(): void {}

  refresh(): void {
    this.search.skip = this.skip;
    this.search.take = this.take;
    this.refresh$.next(true);
  }

  paged(s: number): void {
    this.skip = s;
    this.refresh();
  }

  termed(): void {
    this.skip = 0;
    this.refresh();
  }

  view(w: WorkspaceSummary): void {
    this.viewed = this.viewed !== w ? w : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find((g) => g.id === this.viewed?.id);
  }

  delete(w: WorkspaceSummary): void {
    this.api.delete(w.id).subscribe(() => {
      const found = this.source.find((f) => f.id === w.id);
      if (found) {
        this.source.splice(this.source.indexOf(found), 1);
      }
    });
  }

  update(w: Workspace): void {
    this.api.privilegedUpdate(w).subscribe();
  }

  trackById(index: number, g: WorkspaceSummary): string {
    return g.id;
  }

  select(event: any, workspace: WorkspaceSummary): void {
    if (event.target.checked) {
      this.selected.push(workspace);
      this.selected.sort((a, b) =>
        a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      );
    } else {
      const index = this.selected.findIndex((w) => w.id === workspace.id);
      if (index > -1) {
        this.selected.splice(index, 1);
      }
    }
    // have to refresh the BehaviorSubject to refresh the display
    if (this.readyToDownload) {
      this.pageDownloads(this.skip);
    }
  }

  isSelected(workspaceId: string): boolean {
    return this.selected.some((w) => w.id === workspaceId);
  }

  selectAll(event: any): void {
    if (event.target.checked) {
      this.source.forEach((w) => {
        if (!this.selected.some((s) => s.id === w.id)) {
          this.selected.push(w);
        }
      });
      this.selected.sort((a, b) =>
        a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      );
    } else {
      this.selected.length = 0;
    }
  }

  areAllSelected(): boolean {
    return this.selected.length === this.source.length;
  }

  setReadyToDownload() {
    this.readyToDownload = true;
    this.pageDownloads(0);
  }

  pageDownloads(s: number): void {
    console.log('pageDownloads ' + s + '/' + this.selected.length);
    if (s === this.selected.length) {
      s = s - this.take;
      console.log('adjusted to ' + s + '/' + this.selected.length);
    }
    this.skip = s;
    const endIndex =
      this.selected.length > this.skip + this.take
        ? this.skip + this.take
        : this.selected.length;
    console.log('start/end ' + s + '/' + endIndex);
    const workspaces = this.selected.slice(s, endIndex);
    this.selected$.next(workspaces);
    this.count = endIndex - this.skip;
    this.search.skip = this.skip;
    this.search.take = this.take;
  }

  download(): void {
    this.isDownloading = true;
    const workspaceIds =
      this.selected.length == 0 ? ['all'] : this.selected.map((w) => w.id);
    this.api.downloadWorkspaces(workspaceIds).subscribe(
      (data) => {
        const blob = new Blob([data], {
          type: 'application/zip',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = this.getCurrentDateTime() + '-workspaces.zip';
        this.resetDownload();
        link.click();
      },
      (err) => {
        window.alert('Error downloading file:  ' + err.message);
        this.resetDownload();
      },
      () => {
        this.resetDownload();
      }
    );
  }

  resetDownload(): void {
    this.selected.length = 0;
    this.isDownloading = false;
    this.readyToDownload = false;
    this.selectDownloads = false;
    this.showDownload = false;
    this.count = 0;
    this.skip = 0;
    this.refresh$.next(true);
  }

  /**
   * Selects the file(s) to be uploaded. Called when file selection is changed
   */
  upload(e: any) {
    if (!e.target.files) {
      // this.areButtonsDisabled = false;
      return;
    }
    // this.uploadProgress = 0;
    this.api.uploadWorkspaces(e.target.files).subscribe(
      (result) => {
        alert(
          'The following ' +
            result.length +
            ' workspaces were uploaded ' +
            result.join(', ')
        );
        this.showUpload = false;
      },
      (err) => {
        window.alert('Error uploading file:  ' + err.message);
      },
      () => {}
    );
    this.jsonInput.nativeElement.value = '';
    this.zipInput.nativeElement.value = '';
  }

  getCurrentDateTime(): string {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const seconds = currentDate.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  getDownloadButtonClass() {
    const buttonClass =
      this.selected.length == 0
        ? 'btn btn-outline-info btn-sm mx-1'
        : 'btn btn-outline-info btn-sm mx-1 text-warn';
    return buttonClass;
  }
}
