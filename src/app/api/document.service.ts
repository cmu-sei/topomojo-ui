// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedDocumentService } from './gen/document.service';
import { ImageFile } from './gen/models';

@Injectable()
export class DocumentService extends GeneratedDocumentService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    // public getDocument(guid: string): Observable<string> {
    //     return this.http.get(this.conf.docs + '/' + guid + '.md?ts=' + Date.now(), { responseType: 'text'});
    // }

    public uploadImageWithProgress(guid: string, file: File): Observable<HttpEvent<ImageFile>> {
        const payload: FormData = new FormData();
        payload.append('file', file, file.name);
        return this.http.request<ImageFile>(
            new HttpRequest('POST', this.conf.api + '/image/' + guid, payload, { reportProgress: true })
        );
    }
    public uploadImage(guid: string, file: File): Observable<ImageFile> {
        const payload: FormData = new FormData();
        payload.append('file', file, file.name);
        return this.http.post<ImageFile>(this.conf.api + '/image/' + guid, payload);
    }
}
