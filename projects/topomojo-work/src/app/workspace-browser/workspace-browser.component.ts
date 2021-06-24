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
    private router: Router
  ) {
    this.workspaces = this.refresh$.pipe(
      debounceTime(150),
      // distinctUntilChanged(),
      switchMap(() => this.api.list({term: this.term})),
      tap(data => this.selectWs(data))
    );

    this.gamespaces = this.refresh$.pipe(
      debounceTime(150),
      // distinctUntilChanged(),
      switchMap(() => zip(
        gsapi.list({term: this.term, filter: ['active']}),
        api.list({term: this.term, filter: ['play']})
      ).pipe(
        map(([gs, ws]) => [...gs, ...(ws as unknown as Gamespace[])])
      ))
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.refresh$.next(true);
  }

  termed(e: Event): void {
      this.term = (e.target as HTMLInputElement || {}).value;
      this.refresh$.next(true);
  }

  setMode(mode: string): void {
    this.mode = mode;
  }

  selectWs(data: WorkspaceSummary[]): void {
    if (data.length === 1) {
      this.router.navigate(['/topo', data[0].id, 'settings']);
    }
  }

  selectGs(data: Gamespace[]): void {
    if (data.length === 1) {
      this.router.navigate(['/mojo', data[0].id]);
    }
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

interface GamespaceContext {
  gs: Gamespace[];
  ws: WorkspaceSummary[];
}
