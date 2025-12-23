// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { timer } from 'rxjs';
import { filter, finalize, switchMap } from 'rxjs/operators';
import { ChangedWorkspace, Workspace, Worker } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { ClipboardService } from '../clipboard.service';
import { ConfigService } from '../config.service';
import { faClipboardCheck, faTimes, faUserCog, faTrash, faCopy, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

declare const $: any;

@Component({
  selector: 'app-settings-editor',
  templateUrl: './settings-editor.component.html',
  styleUrls: ['./settings-editor.component.scss'],
  standalone: false
})
export class SettingsEditorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() workspace!: Workspace;
  form: UntypedFormGroup;
  inviteUrl = '';
  copiedInvite = false;
  errors: any[] = [];

  faClipboardCheck = faClipboardCheck;
  faTimes = faTimes;
  faUserCog = faUserCog;
  faTrash = faTrash;
  faCopy = faCopy;
  faInfoCircle = faInfoCircle;

  constructor(
    private config: ConfigService,
    private router: Router,
    private api: WorkspaceService,
    private formBuilder: UntypedFormBuilder,
    private clipboard: ClipboardService
  ) {
    this.form = this.formBuilder.group(
      {
        id: ['', Validators.required],
        name: ['', Validators.required],
        description: [''],
        tags: [''],
        audience: [''],
        author: [''],
        durationMinutes: ['']
      },
      { updateOn: 'blur' }
    );

    this.form.valueChanges
      .pipe(
        filter(f => !this.form.pristine && this.form.valid),
        switchMap(f => api.update(f as ChangedWorkspace))
      )
      .subscribe(() => this.mapToWorkspace(this.form.value));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.workspace) {
      this.form.reset(this.mapToSettings(changes.workspace.currentValue));
      setTimeout(() => this.initTooltips());
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initTooltips();
  }

  private initTooltips(): void {
    if ($ && $.fn && $.fn.tooltip) {
      $('[data-toggle="tooltip"]').tooltip('dispose').tooltip();
    }
  }

  mapToSettings(ws: Workspace): WorkspaceSettings {
    return {
      id: ws.id,
      name: ws.name,
      description: ws.description,
      tags: ws.tags,
      author: ws.author,
      audience: ws.audience,
      durationMinutes: ws.durationMinutes || 0
    };
  }

  mapToWorkspace(model: WorkspaceSettings): void {
    this.workspace.name = model.name;
    this.workspace.description = model.description;
    this.workspace.tags = model.tags;
    this.workspace.author = model.author;
    this.workspace.audience = model.audience;
    this.workspace.durationMinutes = model.durationMinutes;
  }

  enlistCode(): void {
    this.inviteUrl = '';
    this.api
      .generateInvitation(this.workspace.id)
      .pipe(finalize(() => {}))
      .subscribe(result => {
        this.inviteUrl = this.config.externalUrl(`/topo/${this.workspace.id}/invite/${result.code}`);
        this.clipboard.copyToClipboard(this.inviteUrl);
        this.copiedInvite = true;
        timer(4000).subscribe(() => {
          this.copiedInvite = false;
        });
      });
  }

  delist(worker: Worker): void {
    this.api.deleteWorker(worker).subscribe(() => {
      const index = (this.workspace.workers || []).findIndex(w => w.subjectId === worker.subjectId);
      if (index >= 0) {
        this.workspace.workers?.splice(index, 1);
      }
    });
  }

  clone(): void {
    this.api.clone(this.workspace.id).subscribe(
      w => this.router.navigate(['/topo', w.id, 'settings']),
      err => this.errors.push(err)
    );
  }

  delete(): void {
    this.api.delete(this.workspace.id).subscribe(
      () => this.router.navigate(['/']),
      err => this.errors.push(err)
    );
  }
}

interface WorkspaceSettings {
  id: string;
  name: string;
  description: string;
  tags: string;
  author: string;
  audience: string;
  durationMinutes: number;
}
