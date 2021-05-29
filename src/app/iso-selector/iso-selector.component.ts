// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { faArrowDown, faCheck, faCompactDisc, faFile, faPlus, faTrash, faFilter, faSyncAlt, faSync } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { debounceTime, filter, finalize, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { ApiSettings } from '../api/api-settings';
import { FileService } from '../api/file.service';
import { IsoDataFilter, IsoFile } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { ClipboardService } from '../clipboard.service';

@Component({
  selector: 'app-iso-selector',
  templateUrl: './iso-selector.component.html',
  styleUrls: ['./iso-selector.component.scss']
})
export class IsoSelectorComponent implements OnInit, OnChanges {
  @Input() guid = '';
  @Input() collapsed = false;
  @Output() added = new EventEmitter<IsoFile>();
  refresh$ = new BehaviorSubject<IsoDataFilter>({});
  files$: Observable<IsoFile[]>;
  filterLocal = true;
  term = '';

  faCompactDisc = faCompactDisc;
  faCheck = faCheck;
  faFile = faFile;
  faFilter = faFilter;
  faSync = faSyncAlt;

  constructor(
    workspaceSvc: WorkspaceService
  ) {

    this.files$ = this.refresh$.pipe(
      debounceTime(500),
      switchMap(model => workspaceSvc.getIsos(this.guid, model)),
    );

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

}
