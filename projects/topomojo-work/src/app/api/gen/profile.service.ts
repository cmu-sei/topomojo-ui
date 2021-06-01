// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { UserProfile, Search, UserRegistration } from './models';

@Injectable()
export class GeneratedProfileService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public list(search: Search): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(this.conf.api + '/users' + this.paramify(search));
    }
    public load(): Observable<UserProfile> {
        return this.http.get<UserProfile>(this.conf.api + '/user');
    }
    public update(profile: UserProfile): Observable<any> {
        return this.http.put<any>(this.conf.api + '/user', profile);
    }
    public delete(id: number): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/user/' + id);
    }
    public sync(): Observable<any> {
        return this.http.get(this.conf.api + '/version?ts=' + Date.now());
    }
    public ticket(): Observable<any> {
        return this.http.get(this.conf.api + '/user/ticket');
    }

    // pass auth header since this is called as an initializer
    public register(model: UserRegistration, auth: string): Observable<UserProfile> {
      return this.http.post<UserProfile>(`${this.conf.api}/user/register`, model, { headers: { Authorization: auth}});
    }

}
