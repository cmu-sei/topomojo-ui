// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { ChangedWorkspace, Workspace, WorkspaceSummary, Worker } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { ClipboardService } from '../clipboard.service';
import { ConfigService } from '../config.service';
import { faClipboardCheck, faTimes, faUserCog, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-editor',
  templateUrl: './settings-editor.component.html',
  styleUrls: ['./settings-editor.component.scss']
})
export class SettingsEditorComponent implements OnInit, OnChanges {
  @Input() summary!: Workspace;
  form: FormGroup;
  inviteUrl = '';

  faClipboardCheck = faClipboardCheck;
  faTimes = faTimes;
  faUserCog = faUserCog;
  faTrash = faTrash;

  constructor(
    private config: ConfigService,
    private router: Router,
    private api: WorkspaceService,
    private formBuilder: FormBuilder,
    private clipboard: ClipboardService
  ) {
    this.form = this.formBuilder.group({
      id: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      audience: [''],
      author: ['']
    }, {updateOn: 'blur'});

    this.form.valueChanges.pipe(
      filter(f => !this.form.pristine && this.form.valid),
      switchMap(f => api.update(f as ChangedWorkspace))
    ).subscribe(() => this.mapToWorkspace(this.form.value));

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.summary) {
      this.form.reset(this.mapToSettings(changes.summary.currentValue));
    }
  }

  ngOnInit(): void {
  }

  mapToSettings(ws: Workspace): WorkspaceSettings {
    return {
      id: ws.id,
      name: ws.name,
      description: ws.description,
      author: ws.author,
      audience: ws.audience
    };
  }

  mapToWorkspace(model: WorkspaceSettings): void {
    this.summary.name = model.name;
    this.summary.description = model.description;
    this.summary.author = model.author;
    this.summary.audience = model.audience;
  }

  enlistCode(): void {
    this.api.newInvitation(this.summary.id).pipe(
      finalize(() => {})
    ).subscribe(
      result => {
        this.summary.shareCode = result.shareCode;
        this.inviteUrl = `${this.config.absoluteUrl}enlist/${result.shareCode}`;
        this.clipboard.copyToClipboard(this.inviteUrl);
        timer(4000).subscribe(() => this.inviteUrl = '');
      }
    );
  }

  delist(worker: Worker): void {
    this.api.deleteWorker(worker.id).subscribe(
      () => {
        const index = (this.summary.workers || []).findIndex(w => w.id === worker.id);
        if (index >= 0) {
          this.summary.workers?.splice(index, 1);
        }
      }
    );
  }

  delete(): void {
    this.api.delete(this.summary.id).subscribe(
      () => this.router.navigate(['/'])
    );
  }
}

interface WorkspaceSettings {
  id: number;
  name: string;
  description: string;
  author: string;
  audience: string;
}
