// Copyright 2020 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from './api-settings';
import { GeneratedVmService } from './gen/vm.service';
import { KeyValuePair, Vm, VmAnswer, VmQuestion, VmStateEnum, VmTask } from './gen/models';
import { SettingsService } from '../svc/settings.service';

@Injectable()
export class VmService extends GeneratedVmService {

    constructor(
       protected http: HttpClient,
       protected api: ApiSettings,
       private settingSvc: SettingsService
    ) { super(http, api); }

    public openConsole(id, name) {
        this.settingSvc.showTab(`${this.settingSvc.basehref}console/${id}/${name.match(/[^#]*/)[0]}`);
    }
}
