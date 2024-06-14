// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiSettings } from './api-settings';
import { GeneratedConsoleService } from './gen/console.service';
import { } from './gen/models';

@Injectable()
export class ConsoleService extends GeneratedConsoleService {

    constructor(
        protected http: HttpClient,
        protected conf: ApiSettings
    ) { super(http, conf); }
}
