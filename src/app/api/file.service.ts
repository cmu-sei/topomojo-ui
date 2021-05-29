// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedFileService } from './gen/file.service';
import {  } from './gen/models';

@Injectable()
export class FileService extends GeneratedFileService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public uploadIso(id: string, file: File): Observable<HttpEvent<boolean>> {
        const payload: FormData = new FormData();
        payload.append('meta', `size=${file.size}&group-key=${id}`);
        payload.append('file', file, file.name);
        return this.http.request<boolean>(
            new HttpRequest('POST', `${this.conf.api}/file/upload`, payload, { reportProgress: true })
        );
    }
}
