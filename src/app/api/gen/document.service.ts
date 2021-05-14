// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { ImageFile } from './models';

@Injectable()
export class GeneratedDocumentService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public getDocument(guid: string): Observable<string> {
      return this.http.get(this.conf.api + '/document/' + guid, { responseType: 'text'});
    }
    public updateDocument(id: string, text: string): Observable<any> {
        return this.http.put<any>(this.conf.api + '/document/' + id, text);
    }
    public listImages(id: string): Observable<Array<ImageFile>> {
        return this.http.get<Array<ImageFile>>(this.conf.api + '/images/' + id);
    }
    public deleteImage(id: string, filename: string): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/image/' + id, { params: {filename}});
    }

}
