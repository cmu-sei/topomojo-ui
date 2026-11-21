// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { ApiSettings } from './api-settings';
import { GeneratedAdminService } from './gen/admin.service';
import { IsoFile, VmOptions } from './gen/models';

export type ThemeInfo = { backgroundUrl: string | null };
export type TemplateSource = {
    name: string;
    isGlobal: boolean;
    workspaceId?: string;
    workspaceName?: string;
    templateName?: string;
    created?: string;
    modified?: string;
};
// enabled is false when the API's Core:EnableTemplateSources is off; field is then unset and sources empty.
export type TemplateSourceReport = { enabled: boolean; field?: 'disks' | 'template'; sources: TemplateSource[] };
export type AdminFeatures = { templateSources: boolean };

@Injectable()
export class AdminService extends GeneratedAdminService {

    private features$?: Observable<AdminFeatures>;

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

    // Optional features the API has turned on. Fetched once and shared; an API without
    // api/admin/features (or any error) reports every feature off.
    public getFeatures(): Observable<AdminFeatures> {
        this.features$ ??= this.http.get<AdminFeatures>(this.conf.api + '/admin/features').pipe(
            catchError(() => of({ templateSources: false })),
            shareReplay(1)
        );
        return this.features$;
    }

    public getTemplateSources(): Observable<TemplateSourceReport> {
        return this.http.get<TemplateSourceReport>(this.conf.api + '/admin/template-sources');
    }

    public getAllIsos(): Observable<IsoFile[]> {
        return this.http.get<VmOptions>(this.conf.api + '/admin/isos').pipe(
            map((r) => (r.iso || []).map(
                (path) => ({ path, display: path.split('/').pop() } as IsoFile)
            ))
        );
    }

}
