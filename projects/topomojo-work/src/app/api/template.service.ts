// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedTemplateService } from './gen/template.service';

@Injectable()
export class TemplateService extends GeneratedTemplateService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public listTemplateFavorites(): Observable<string[]> {
        return this.http.get<string[]>(this.conf.api + '/template-favorites');
    }

    public favoriteTemplate(templateId: string): Observable<void> {
        return this.http.put<void>(this.conf.api + `/template-favorite/${encodeURIComponent(templateId)}`, null);
    }

    public unfavoriteTemplate(templateId: string): Observable<void> {
        return this.http.delete<void>(this.conf.api + `/template-favorite/${encodeURIComponent(templateId)}`);
    }
}
