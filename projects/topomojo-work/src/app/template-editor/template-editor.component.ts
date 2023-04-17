// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Template, TemplateReLink, TemplateSearch, TemplateSummary } from '../api/gen/models';
import { TemplateService } from '../api/template.service';
import { faEdit, faLink, faUnlink, faTrash } from '@fortawesome/free-solid-svg-icons';
import { VmControllerComponent } from '../utility/vm-controller/vm-controller.component';
import { filter, finalize, first, map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, Subscription, Subject, Observable } from 'rxjs';

@Component({
  selector: 'app-template-editor',
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss']
})
export class TemplateEditorComponent implements OnInit, AfterViewInit {
  @Input() template!: Template;
  @Output() deleted = new EventEmitter<Template>();
  @ViewChild('toolbar') toolbar!: VmControllerComponent;
  refresh$ = new Subject<string>();
  revisions$: Observable<TemplateSummary[]>;
  editing = false;

  faEdit = faEdit;
  faLink = faLink;
  faUnlink = faUnlink;
  faTrash = faTrash;

  constructor(
    private api: TemplateService
  ) {
    this.revisions$ = this.refresh$.pipe(
      filter(id => !!id),
      switchMap(id => api.listSiblings(id, true)),
      map(r => r.filter(i => i.id !== this.template.id))
    );
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.refresh$.next(this.template.id);
  }

  unlink(): void {
    const s: Subscription = this.api.unlink({
      templateId: this.template.id,
      workspaceId: this.template.workspaceId
    }).pipe(
      finalize(() => s.unsubscribe())
    ).subscribe(t => {
      this.template = t;
      this.toolbar.task$.next('');
    });
  }

  relink(rev: TemplateSummary): void {
    this.api.relink({
      templateId: this.template.id,
      parentId: rev.id,
      workspaceId: this.template.workspaceId
    } as TemplateReLink).pipe(
      first()
    ).subscribe(t => {
      this.template = t;
      this.refresh$.next(t.id);
    });
  }

  delete(): void {
    // console.log('delete');
    const s: Subscription = this.api.delete(this.template.id).pipe(
      finalize(() => s.unsubscribe())
    ).subscribe(
      () => this.deleted.emit(this.template)
    );
  }
}
