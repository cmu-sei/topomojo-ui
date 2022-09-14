// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { faFilter, faSync, faSyncAlt } from '@fortawesome/free-solid-svg-icons';
import { Observable, BehaviorSubject, of, zip } from 'rxjs';
import { map, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { Gamespace, WorkspaceSummary } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';
import { AuthService } from '../auth.service';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-workspace-browser',
  templateUrl: './workspace-browser.component.html',
  styleUrls: ['./workspace-browser.component.scss']
})
export class WorkspaceBrowserComponent implements OnInit {
  @ViewChild('search') search!: ElementRef;
  workspaces: Observable<WorkspaceSummary[]>;
  gamespaces: Observable<Gamespace[]>;
  refresh$ = new BehaviorSubject<boolean>(true);
  term = '';
  mode = 'workspace';
  faFilter = faFilter;
  faSync = faSyncAlt;

  constructor(
    private auth: AuthService,
    private api: WorkspaceService,
    private gsapi: GamespaceService,
    private router: Router,
    private config: ConfigService
  ) {

    const local = config.getLocal();
    this.mode = local.browseMode || 'workspace';
    this.term = local.browseTerm || '';

    this.workspaces = this.refresh$.pipe(
      debounceTime(150),
      // distinctUntilChanged(),
      switchMap(() => this.api.list({term: this.term})),
    );

    this.gamespaces = this.refresh$.pipe(
      debounceTime(150),
      // distinctUntilChanged(),
      switchMap(() => zip(
        gsapi.list({term: this.term, filter: ['active']}),
        api.list({term: this.term, filter: ['play']})
      ).pipe(
        map(([gs, ws]) => [...gs, ...(ws as unknown as Gamespace[])]),
        tap(() => this.config.updateLocal({browseTerm: this.term}))
      ))
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.refresh$.next(true);
  }

  termed(e: Event): void {
      this.refresh$.next(true);
  }

  setMode(mode: string): void {
    this.mode = mode;
    this.config.updateLocal({browseMode: mode});
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    if (ev.ctrlKey && ev.code === 'KeyO') {
      this.search.nativeElement.focus();
      this.search.nativeElement.select();
      return false;
    }
    return true;
  }

}
