// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import {  } from './models';

@Injectable()
export class GeneratedConsoleService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public getByName(id: string, name: string): Observable<any> {
        return this.http.get<any>(this.conf.api + '/console/' + id + '/' + name);
    }

}
