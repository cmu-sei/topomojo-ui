// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
// tslint:disable-next-line:max-line-length
import { ChangedWorkspace, GameState, NewWorkspace, Player, Search, Template, Workspace, WorkspaceState, WorkspaceSummary, VmOptions, VmState, Worker } from './models';

@Injectable()
export class GeneratedWorkspaceService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public list(search: Search): Observable<WorkspaceSummary[]> {
        return this.http.get<WorkspaceSummary[]>(this.conf.api + '/workspaces' + this.paramify(search));
    }
    public load(id: number): Observable<Workspace> {
        return this.http.get<Workspace>(this.conf.api + '/v2/workspace/' + id);
    }
    public update(model: ChangedWorkspace): Observable<any> {
        return this.http.put<any>(this.conf.api + '/workspace', model);
    }
    public create(model: NewWorkspace): Observable<Workspace> {
        return this.http.post<Workspace>(this.conf.api + '/workspace', model);
    }
    public delete(id: number): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/workspace/' + id);
    }
    public listWorkspaceGames(id: number): Observable<Array<GameState>> {
        return this.http.get<Array<GameState>>(this.conf.api + '/workspace/' + id + '/games');
    }
    public deleteWorkspaceGames(id: number): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/workspace/' + id + '/games');
    }
    public newInvitation(id: number): Observable<WorkspaceState> {
        return this.http.put<WorkspaceState>(this.conf.api + '/workspace/' + id + '/invite', {});
    }
    public createWorker(code: string): Observable<WorkspaceSummary> {
        return this.http.post<WorkspaceSummary>(this.conf.api + '/worker/' + code, {});
    }
    public deleteWorker(id: number): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/worker/' + id);
    }
    public getWorkspaceIsos(id: string): Observable<VmOptions> {
        return this.http.get<VmOptions>(this.conf.api + '/workspace/' + id + '/isos');
    }
    public getWorkspaceNets(id: string): Observable<VmOptions> {
        return this.http.get<VmOptions>(this.conf.api + '/workspace/' + id + '/nets');
    }
    public putWorkspaceChallenge(id: number, model: any): Observable<any> {
        return this.http.put(this.conf.api + '/workspace/' + id + '/challenge', model);
    }
}
