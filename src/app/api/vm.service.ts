// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedVmService } from './gen/vm.service';
import { KeyValuePair, Vm, VmAnswer, VmQuestion, VmStateEnum, VmTask } from './gen/models';
import { ConfigService } from '../config.service';

@Injectable()
export class VmService extends GeneratedVmService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings,
       private tabs: ConfigService
    ) { super(http, conf); }

    public openConsole(id: string, name: string): void {
        this.tabs.showTab('/console/' + id + '/' + name.match(/[^#]*/)?.[0]);
    }
}
