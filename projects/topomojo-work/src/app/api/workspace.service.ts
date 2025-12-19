// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedWorkspaceService } from './gen/workspace.service';
import { tap, map } from 'rxjs/operators';

@Injectable()
export class WorkspaceService extends GeneratedWorkspaceService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    private workspaceFavoritesSubject = new BehaviorSubject<Set<string>>(new Set());
    workspaceFavorites$ = this.workspaceFavoritesSubject.asObservable();

    public listWorkspaceFavorites(): Observable<string[]> {
        return this.http.get<string[]>(this.conf.api + '/workspace-favorites');
    }

    public favoriteWorkspace(workspaceId: string): Observable<void> {
        return this.http.put<void>(this.conf.api + `/workspace-favorite/${workspaceId}`, {});
    }

    public unfavoriteWorkspace(workspaceId: string): Observable<void> {
        return this.http.delete<void>(this.conf.api + `/workspace-favorite/${workspaceId}`);
    }

    syncWorkspaceFavorites(): Observable<Set<string>> {
        return this.listWorkspaceFavorites().pipe(
        map(ids => new Set(ids)),
        tap(set => this.workspaceFavoritesSubject.next(set))
        );
    }
}
