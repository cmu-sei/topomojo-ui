// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { BehaviorSubject, concat, merge, Observable, of, Subject, Subscription, timer, zip } from 'rxjs';
import { catchError, concatAll, concatMap, debounceTime, distinctUntilChanged, filter, finalize, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { Template, TemplateLink, TemplateSearch, TemplateSummary } from '../api/gen/models';
import { TemplateService } from '../api/template.service';
import { faPlus, faCheck, faFilter } from '@fortawesome/free-solid-svg-icons';
import { WorkspaceService } from '../api/workspace.service';

@Component({
  selector: 'app-template-selector',
  templateUrl: './template-selector.component.html',
  styleUrls: ['./template-selector.component.scss']
})
export class TemplateSelectorComponent implements OnInit, OnDestroy {
  @Input() workspaceId = '';
  @Output() added = new EventEmitter<Template>();
  refresh$ = new BehaviorSubject<boolean>(true);
  templates$: Observable<TemplateSummary[]>;
  templates: TemplateSummary[] = [];
  term = new BehaviorSubject<KeyboardEvent>(new KeyboardEvent('keyup'));
  target = new Subject<TemplateSummary>();
  active!: TemplateSummary | null;
  scopes: string[] = [];
  showing = false;
  target$: Subscription;
  search: TemplateSearch = { term: '', filter: ['published'] };
  filter = 'public';
  faPlus = faPlus;
  faCheck = faCheck;
  faFilter = faFilter;
  errors: any[] = [];
  templateSets: any[] = [];

  constructor(
    private api: TemplateService,
    private wsapi: WorkspaceService
  ) {

    // local filter/sort
    const tfilter = (a: TemplateSummary[]) => a.filter(i =>
      i.name.match(this.search.term) ||
      i.description?.match(this.search.term)
    ).sort((i: TemplateSummary, j: TemplateSummary) =>
      i.name < j.name ? -1 : i.name > j.name ? 1 : 0
    );

    const distinctFilter = (v: TemplateSummary, i: number, s: TemplateSummary[]) => {
      return v.workspaceId
        ? s.indexOf(s.find(t => t.workspaceId === v.workspaceId)!) === i
        : false
      ;
    }

    // refresh view
    this.templates$ = this.refresh$.pipe(
      debounceTime(250),
      switchMap(() => of(this.templates)),
      map(a => tfilter(a)),
      tap(a => this.templateSets = a.filter(distinctFilter).map(t => ({id: t.workspaceId, name: t.workspaceName})))
    );

    // link action
    this.target$ = this.target.pipe(
      // debounceTime(250),
      tap(t => this.active = t),
      concatMap(t => api.link({workspaceId: this.workspaceId, templateId: t.id} as TemplateLink).pipe(
        catchError(err => {
          this.errors.push(err);
          return of({} as Template);
        })
      )),
      tap(t => this.feedback(t))
    ).subscribe();
  }

  ngOnInit(): void {

    // initial data load
    zip(
      this.api.list({ term: '', filter: ['published'] }),
      this.wsapi.getWorkspaceTemplates(this.workspaceId)
    ).pipe(
      map(([a, b]) => [...a, ...b])
    ).subscribe(result =>
      this.templates = result
    );
  }

  ngOnDestroy(): void {
    this.target$.unsubscribe();
  }

  feedback(t: Template): void {
    if (!!t.id) {
      this.added.emit(t);
    }
    const sub: Subscription = timer(2000).pipe(
      finalize(() => sub.unsubscribe())
    ).subscribe(() => this.active = null);
  }

  toggleAudience(aud: string): void {
    this.filter = aud;
    this.refresh$.next(true);
  }

  addSet(id: string): void {
    this.templates
      .filter(t => t.workspaceId === id)
      .forEach(t => this.target.next(t))
    ;
  }
}
