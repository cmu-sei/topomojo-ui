// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, map, retry, shareReplay } from 'rxjs/operators';
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

export interface HypervisorCapacityNode {
    name: string;
    available: boolean;
    memoryTotalMb: number;
    memoryUsedMb: number;
    cpuCores: number;
    cpuUsagePercent: number;
}

export interface HypervisorCapacityStorage {
    name: string;
    node?: string;
    shared: boolean;
    available: boolean;
    totalMb: number;
    usedMb: number;
}

export interface HypervisorCapacity {
    provider: string;
    asOf: string;
    nodes: HypervisorCapacityNode[];
    storage: HypervisorCapacityStorage[];
    poolMemoryFreeMb?: number;
}

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

    public getCapacity(): Observable<HypervisorCapacity> {
        return this.http.get<HypervisorCapacity>(this.conf.api + '/admin/capacity');
    }

    // Optional features the API has turned on, fetched once and shared. An API without
    // api/admin/features (404) has every feature off. Other errors are retried, then report
    // every feature off without being kept, so the next caller asks again.
    public getFeatures(): Observable<AdminFeatures> {
        this.features$ ??= this.http.get<AdminFeatures>(this.conf.api + '/admin/features').pipe(
            retry({
                count: 2,
                delay: (err: HttpErrorResponse) => err.status === 404 ? throwError(() => err) : timer(1000)
            }),
            catchError((err: HttpErrorResponse) => {
                if (err.status !== 404) {
                    this.features$ = undefined;
                }
                return of({ templateSources: false });
            }),
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
