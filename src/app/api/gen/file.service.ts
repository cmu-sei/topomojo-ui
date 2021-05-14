// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import {  } from './models';

@Injectable()
export class GeneratedFileService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public getFileProgress(id: string): Observable<number> {
        return this.http.get<number>(this.conf.api + '/file/progress/' + id);
    }
    public postFileUpload(): Observable<boolean> {
        return this.http.post<boolean>(this.conf.api + '/file/upload', {});
    }

}
