// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { iif, Observable, of } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
// tslint:disable-next-line:max-line-length
import { ChangedWorkspace, NewWorkspace, Search, Workspace, JoinCode, WorkspaceSummary, VmOptions, ChallengeSpec, IsoFile, IsoDataFilter, WorkspaceStats, TemplateSummary, Worker } from './models';
import { map, tap } from 'rxjs/operators';
import { identifierModuleUrl } from '@angular/compiler';

@Injectable()
export class GeneratedWorkspaceService extends GeneratedService {
  isoCache!: IsoFile[];
  isoCacheId = '';

  constructor(
      protected http: HttpClient,
      protected conf: ApiSettings
  ) { super(http, conf); }

  public list(search: Search): Observable<WorkspaceSummary[]> {
      return this.http.get<WorkspaceSummary[]>(this.conf.api + '/workspaces' + this.paramify(search));
  }
  public load(id: string): Observable<Workspace> {
      return this.http.get<Workspace>(this.conf.api + '/workspace/' + id);
  }
  public create(model: NewWorkspace): Observable<Workspace> {
      return this.http.post<Workspace>(this.conf.api + '/workspace', model);
  }
  public clone(id: string): Observable<Workspace> {
      return this.http.post<Workspace>(this.conf.api + '/workspace/' + id + '/clone', {});
  }
  public update(model: ChangedWorkspace): Observable<any> {
      return this.http.put<any>(this.conf.api + '/workspace', model);
  }
  public delete(id: string): Observable<any> {
      return this.http.delete<any>(this.conf.api + '/workspace/' + id);
  }
  public getStats(id: string): Observable<WorkspaceStats> {
      return this.http.get<WorkspaceStats>(this.conf.api + '/workspace/' + id + '/stats');
  }
  public deleteWorkspaceGames(id: string): Observable<WorkspaceStats> {
      return this.http.delete<WorkspaceStats>(this.conf.api + '/workspace/' + id + '/games');
  }
  public generateInvitation(id: string): Observable<JoinCode> {
      return this.http.put<JoinCode>(this.conf.api + '/workspace/' + id + '/invite', {});
  }
  public enlist(code: string): Observable<WorkspaceSummary> {
      return this.http.post<WorkspaceSummary>(this.conf.api + '/worker/' + code, {});
  }
  public deleteWorker(worker: Worker): Observable<any> {
      return this.http.delete<any>(this.conf.api + `/workspace/${worker.workspaceId}/worker/${worker.subjectId}`);
  }
  public getWorkspaceIsos(id: string): Observable<VmOptions> {
      return this.http.get<VmOptions>(this.conf.api + '/workspace/' + id + '/isos');
  }
  public getWorkspaceNets(id: string): Observable<VmOptions> {
      return this.http.get<VmOptions>(this.conf.api + '/workspace/' + id + '/nets');
  }
  public getWorkspaceTemplates(id: string): Observable<TemplateSummary[]> {
    return this.http.get<TemplateSummary[]>(this.conf.api + '/workspace/' + id + '/templates');
  }
  public getWorkspaceChallenge(id: string): Observable<ChallengeSpec> {
    return this.http.get<ChallengeSpec>(this.conf.api + '/challenge/' + id);
  }
  public putWorkspaceChallenge(id: string, model: ChallengeSpec): Observable<any> {
      return this.http.put<any>(this.conf.api + '/challenge/' + id, model);
  }
  public getIsos(id: string, filter: IsoDataFilter): Observable<IsoFile[]> {
    return iif(() => filter.refresh || !this.isoCache || this.isoCacheId !== id,
      this.http.get<VmOptions>(this.conf.api + '/workspace/' + id + '/isos').pipe(
        map(r => (r.iso || []).map(path => ({path, display: path.split('/').pop()}) as IsoFile)),
        tap(r => { this.isoCache = r; this.isoCacheId = id; })
      ),
      of(this.isoCache)
    ).pipe(
      map(list => filter.local ? list.filter(i => i.path.match(id)) : list),
      map(list => filter.term ? list.filter(i => i.display.match(filter.term || '')) : list)
    );
  }
}
