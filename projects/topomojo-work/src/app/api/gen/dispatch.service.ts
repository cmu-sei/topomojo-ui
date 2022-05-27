// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { ChangedDispatch, Dispatch, DispatchSearch, NewDispatch } from './models';

@Injectable()
export class GeneratedDispatchService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public list(search: DispatchSearch): Observable<Dispatch[]> {
        return this.http.get<Dispatch[]>(this.conf.api + '/dispatches' + this.paramify(search));
    }
    public load(id: string): Observable<Dispatch> {
        return this.http.get<Dispatch>(this.conf.api + '/dispatch/' + id);
    }
    public create(dispatch: NewDispatch): Observable<any> {
        return this.http.post<any>(this.conf.api + '/dispatch', dispatch);
    }
    public update(dispatch: ChangedDispatch): Observable<any> {
        return this.http.put<any>(this.conf.api + '/dispatch', dispatch);
    }
    public delete(id: string): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/dispatch/' + id);
    }
}
