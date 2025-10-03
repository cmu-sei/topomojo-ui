// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { ApiKey, ApiKeyResult, ApiUser, ChangedUser, Search, UserRegistration, UserSearch } from './models';

@Injectable()
export class GeneratedProfileService extends GeneratedService {

    constructor(
        protected http: HttpClient,
        protected conf: ApiSettings
    ) { super(http, conf); }

    public list(search: UserSearch): Observable<ApiUser[]> {
        return this.http.get<ApiUser[]>(this.conf.api + '/users' + this.paramify(search));
    }
    public listScopes(): Observable<string[]> {
        return this.http.get<string[]>(this.conf.api + '/user/scopes');
    }
    public load(): Observable<ApiUser> {
        return this.http.get<ApiUser>(this.conf.api + '/user');
    }
    public update(profile: ChangedUser): Observable<ApiUser> {
        return this.http.post<ApiUser>(this.conf.api + '/user', profile);
    }
    public delete(id: string): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/user/' + id);
    }
    public ticket(): Observable<any> {
        return this.http.get(this.conf.api + '/user/ticket');
    }
    public login(): Observable<any> {
        return this.http.post<any>(this.conf.api + '/user/login', null);
    }
    public logout(): Observable<any> {
        return this.http.post<any>(this.conf.api + '/user/logout', null);
    }
    public getApiKeys(id: string): Observable<ApiKey[]> {
        return this.http.get<ApiKey[]>(this.conf.api + `/user/${id}/keys`);
    }
    public generateApiKey(id: string): Observable<ApiKeyResult> {
        return this.http.post<ApiKeyResult>(this.conf.api + `/apikey/${id}`, null);
    }
    public deleteApiKey(id: string): Observable<any> {
        return this.http.delete<any>(this.conf.api + `/apikey/${id}`);
    }


    // pass auth header since this is called as an initializer
    public register(model: UserRegistration, auth: string): Observable<ApiUser> {
        return this.http.post<ApiUser>(`${this.conf.api}/user/register`, model, { headers: { Authorization: auth } });
    }

}
