// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedAdminService } from './gen/admin.service';
import { CachedConnection } from './gen/models';

export type ThemeInfo = { backgroundUrl: string | null };

@Injectable()
export class AdminService extends GeneratedAdminService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public export(ids: Array<number>): Observable<Array<string>> {
        return this.http.post<Array<string>>(this.conf.api + '/admin/export', ids);
    }

    public getTheme(): Observable<ThemeInfo> {
        return this.http.get<ThemeInfo>(this.conf.api + '/theme');
    }

    public uploadBackground(file: File): Observable<ThemeInfo> {
        const fd = new FormData();
        fd.append('file', file, file.name);
        return this.http.post<ThemeInfo>(this.conf.api + '/admin/background', fd);
    }

    public clearBackground(): Observable<ThemeInfo> {
        return this.http.delete<ThemeInfo>(this.conf.api + '/admin/background');
    }
}
