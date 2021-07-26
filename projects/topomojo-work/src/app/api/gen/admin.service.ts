// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { CachedConnection, JanitorReport } from './models';

@Injectable()
export class GeneratedAdminService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public loadVersion(): Observable<any> {
      return this.http.get<any>(this.conf.api + '/version');
    }
    public createAnnouncement(text: string): Observable<boolean> {
        return this.http.post<boolean>(this.conf.api + '/admin/announce', text);
    }
    public export(ids: Array<number>): Observable<Array<string>> {
        return this.http.post<Array<string>>(this.conf.api + '/admin/export', {});
    }
    public import(): Observable<Array<string>> {
        return this.http.get<Array<string>>(this.conf.api + '/admin/import');
    }
    public listConnections(): Observable<Array<CachedConnection>> {
        return this.http.get<Array<CachedConnection>>(this.conf.api + '/admin/live');
    }
    public cleanup(): Observable<JanitorReport[]> {
      return this.http.post<JanitorReport[]>(this.conf.api + '/admin/janitor', null);
    }
    public getlog(since: string): Observable<any> {
      return this.http.get<any>(this.conf.api + '/admin/log', {params: {since}});
    }
}
