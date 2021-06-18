// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs/operators';
import { Template, TemplateLink, TemplateSummary } from '../api/gen/models';
import { TemplateService } from '../api/template.service';
import { faPlus, faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-template-selector',
  templateUrl: './template-selector.component.html',
  styleUrls: ['./template-selector.component.scss']
})
export class TemplateSelectorComponent implements OnInit, OnDestroy {
  @Input() workspaceId = '';
  @Output() added = new EventEmitter<Template>();
  templates: Observable<TemplateSummary[]>;
  term = new BehaviorSubject<KeyboardEvent>(new KeyboardEvent('keyup'));
  target = new Subject<TemplateSummary>();
  active!: TemplateSummary | null;
  showing = false;
  target$: Subscription;

  faPlus = faPlus;
  faCheck = faCheck;

  constructor(
    api: TemplateService
  ) {
    this.templates = this.term.pipe(
      map((e: KeyboardEvent) => (e.target as HTMLInputElement || {}).value),
      debounceTime(150),
      distinctUntilChanged(),
      switchMap(term => api.list({term, filter: ['published']}))
    );

    this.target$ = this.target.pipe(
      debounceTime(150),
      tap(t => this.active = t),
      switchMap(t => api.link({workspaceId: this.workspaceId, templateId: t.globalId} as TemplateLink)),
      tap(t => this.feedback(t))
    ).subscribe();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.target$.unsubscribe();
  }

  feedback(t: Template): void {
    this.added.emit(t);
    const sub: Subscription = timer(2000).pipe(
      finalize(() => sub.unsubscribe())
    ).subscribe(() => this.active = null);
  }

}
