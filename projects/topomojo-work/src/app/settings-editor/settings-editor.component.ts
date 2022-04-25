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
import { faClipboardCheck, faTimes, faUserCog, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-editor',
  templateUrl: './settings-editor.component.html',
  styleUrls: ['./settings-editor.component.scss']
})
export class SettingsEditorComponent implements OnInit, OnChanges {
  @Input() workspace!: Workspace;
  form: FormGroup;
  inviteUrl = '';
  copiedInvite = false;
  errors: any[] = [];

  faClipboardCheck = faClipboardCheck;
  faTimes = faTimes;
  faUserCog = faUserCog;
  faTrash = faTrash;
  faCopy = faCopy;

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
      author: [''],
      durationMinutes: ['']
    }, {updateOn: 'blur'});

    this.form.valueChanges.pipe(
      filter(f => !this.form.pristine && this.form.valid),
      switchMap(f => api.update(f as ChangedWorkspace))
    ).subscribe(() => this.mapToWorkspace(this.form.value));

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.workspace) {
      this.form.reset(this.mapToSettings(changes.workspace.currentValue));
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
      audience: ws.audience,
      durationMinutes: ws.durationMinutes || 0
    };
  }

  mapToWorkspace(model: WorkspaceSettings): void {
    this.workspace.name = model.name;
    this.workspace.description = model.description;
    this.workspace.author = model.author;
    this.workspace.audience = model.audience;
    this.workspace.durationMinutes = model.durationMinutes;
  }

  enlistCode(): void {
    this.inviteUrl = '';
    this.api.generateInvitation(this.workspace.id).pipe(
      finalize(() => {})
    ).subscribe(
      result => {
        this.inviteUrl = `${this.config.absoluteUrl}enlist/${result.code}`;
        this.clipboard.copyToClipboard(this.inviteUrl);
        this.copiedInvite = true;
        timer(4000).subscribe(() => {
          this.copiedInvite = false;
        });
      }
    );
  }

  delist(worker: Worker): void {
    this.api.deleteWorker(worker).subscribe(
      () => {

        const index = (this.workspace.workers || [])
          .findIndex(w => w.subjectId === worker.subjectId)
        ;

        if (index >= 0) {
          this.workspace.workers?.splice(index, 1);
        }
      }
    );
  }

  clone(): void {
    this.api.clone(this.workspace.id).subscribe(
      w => this.router.navigate(['/topo', w.id, 'settings']),
      (err) => this.errors.push(err)
    );
  }

  delete(): void {
    this.api.delete(this.workspace.id).subscribe(
      () => this.router.navigate(['/']),
      (err) => this.errors.push(err)
    );
  }
}

interface WorkspaceSettings {
  id: string;
  name: string;
  description: string;
  author: string;
  audience: string;
  durationMinutes: number;
}
