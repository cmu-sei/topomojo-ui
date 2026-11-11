// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedWorkspaceService } from './gen/workspace.service';
import { IsoUsageReport } from './gen/models';

export interface WorkspaceDemand {
    vmCount: number;
    memoryMb: number;
    vcpu: number;
}

// GET api/workspace/{id}/capacity: how many more gamespaces of a workspace fit
export interface WorkspaceCapacity {
    workspaceId: string;
    provider: string;
    asOf: string;
    requested: number;
    // null when the workspace has no templates, so nothing limits it
    fits: number | null;
    sufficient: boolean;
    limitedBy: 'memory' | 'pool' | null;
    headroomPercent: number;
    perInstance: WorkspaceDemand;
    memoryFreeMb: number;
    memoryTotalMb: number;
    cpuCores: number;
    cpuUsagePercent: number;
}
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

    public deleteIso(workspaceId: string, isoPath: string): Observable<void> {
        return this.http.delete<void>(
            `${this.conf.api}/workspace/${workspaceId}/iso`,
            { params: { path: isoPath } }
        );
    }

    public getCapacity(workspaceId: string, players = 1, count = 1): Observable<WorkspaceCapacity> {
        return this.http.get<WorkspaceCapacity>(
            `${this.conf.api}/workspace/${workspaceId}/capacity`,
            { params: { players, count } }
        );
    }

    public checkIsoUsage(workspaceId: string, path: string): Observable<IsoUsageReport> {
        return this.http.get<IsoUsageReport>(
            `${this.conf.api}/workspace/${workspaceId}/iso-usage`,
            { params: { path } }
        );
    }
}
