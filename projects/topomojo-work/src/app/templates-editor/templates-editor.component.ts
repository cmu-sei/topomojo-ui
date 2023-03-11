// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { Template, Workspace } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-templates-editor',
  templateUrl: './templates-editor.component.html',
  styleUrls: ['./templates-editor.component.scss']
})
export class TemplatesEditorComponent implements OnInit, OnDestroy {
  @Input() workspace!: Workspace;
  hubsub: Subscription;
  faTrash = faTrash;

  constructor(
    private api: WorkspaceService,
    private hub: NotificationService
  ) {
    this.hubsub = hub.templateEvents.subscribe(ev => {

      const template = this.workspace.templates?.find(t => t.id == ev.model.id);

      const index = !!template
        ? this.workspace.templates!.indexOf(template)
        : -1
      ;

      if (template && ev.action === 'TEMPLATE.REMOVED') {
        this.workspace.templates?.splice(index, 1);
        return;
      }

      if (template && ev.action === 'TEMPLATE.UPDATED') {
        this.workspace.templates?.splice(index, 1, ev.model);
      }

      if (!template && ev.action === 'TEMPLATE.ADDED') {
        this.workspace.templates?.push(ev.model);
      }

    });
  }

  ngOnDestroy(): void {
    if (!this.hubsub.closed) { this.hubsub.unsubscribe(); }
  }

  ngOnInit(): void {
  }

  add(target: Template): void {
    // // handled by hub
    // this.workspace.templates?.push(target);
  }

  remove(target: Template): void {
    // // handled by hub
    // this.workspace.templates = this.workspace.templates?.filter(t => t.id !== target.id);
  }

  deleteGamespaces(): void {
    this.api.deleteWorkspaceGames(this.workspace.id).subscribe(
      () => this.workspace.stats.activeGamespaceCount = 0
    );
  }

  trackById(index: number, g: Template): string {
    return g.id;
  }
}
