// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Template, Workspace, WorkspaceSummary } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-templates-editor',
  templateUrl: './templates-editor.component.html',
  styleUrls: ['./templates-editor.component.scss']
})
export class TemplatesEditorComponent implements OnInit {
  @Input() workspace!: Workspace;
  faTrash = faTrash;

  constructor(
    private api: WorkspaceService,
    private hub: NotificationService
  ) {
  }

  ngOnInit(): void {
  }

  add(target: Template): void {
    this.workspace.templates?.push(target);
  }

  remove(target: Template): void {
    this.workspace.templates = this.workspace.templates?.filter(t => t.id !== target.id);
  }

  deleteGamespaces(): void {
    this.api.deleteWorkspaceGames(this.workspace.id).subscribe(
      () => this.workspace.gamespaceCount = 0
    );
  }
}
