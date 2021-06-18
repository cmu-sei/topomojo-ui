// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Template } from '../api/gen/models';
import { TemplateService } from '../api/template.service';
import { faEdit, faLink, faUnlink, faTrash } from '@fortawesome/free-solid-svg-icons';
import { VmControllerComponent } from '../utility/vm-controller/vm-controller.component';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss']
})
export class TemplateEditorComponent implements OnInit {
  @Input() template!: Template;
  @Output() deleted = new EventEmitter<Template>();
  @ViewChild('toolbar') toolbar!: VmControllerComponent;
  editing = false;

  faEdit = faEdit;
  faLink = faLink;
  faUnlink = faUnlink;
  faTrash = faTrash;

  constructor(
    private api: TemplateService
  ) { }

  ngOnInit(): void {

  }

  unlink(): void {
    const s: Subscription = this.api.unlink({
      templateId: this.template.globalId,
      workspaceId: this.template.workspaceGlobalId
    }).pipe(
      finalize(() => s.unsubscribe())
    ).subscribe(t => {
      this.template = t;
      this.toolbar.task$.next('');
    });
  }

  delete(): void {
    console.log('delete');
    const s: Subscription = this.api.delete(this.template.globalId).pipe(
      finalize(() => s.unsubscribe())
    ).subscribe(
      () => this.deleted.emit(this.template)
    );
  }
}
