// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSettings } from './api-settings';
import { GeneratedAdminService } from './gen/admin.service';
import { IsoFile, VmOptions } from './gen/models';

export type ThemeInfo = { backgroundUrl: string | null };

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

export interface CapacityAlert {
    name: string;
    node?: string;
    resource: 'memory' | 'storage';
    percent: number;
    level: 'warning' | 'critical';
}

export interface HypervisorCapacity {
    provider: string;
    asOf: string;
    nodes: HypervisorCapacityNode[];
    storage: HypervisorCapacityStorage[];
    poolMemoryFreeMb?: number;
    // Core:CapacityWarnPercent / Core:CapacityCriticalPercent, and what is over them
    warnPercent?: number;
    criticalPercent?: number;
    alerts?: CapacityAlert[];
}

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

    public getCapacity(): Observable<HypervisorCapacity> {
        return this.http.get<HypervisorCapacity>(this.conf.api + '/admin/capacity');
    }

    public getAllIsos(): Observable<IsoFile[]> {
        return this.http.get<VmOptions>(this.conf.api + '/admin/isos').pipe(
            map((r) => (r.iso || []).map(
                (path) => ({ path, display: path.split('/').pop() } as IsoFile)
            ))
        );
    }

}
