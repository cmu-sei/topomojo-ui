// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AdminService } from '../admin.service';
import { ConsoleService } from '../console.service';
import { DocumentService } from '../document.service';
import { FileService } from '../file.service';
import { GamespaceService } from '../gamespace.service';
import { ProfileService } from '../profile.service';
import { TemplateService } from '../template.service';
import { WorkspaceService } from '../workspace.service';
import { VmService } from '../vm.service';

import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApiSettings } from '../api-settings';

@NgModule({
    imports: [ HttpClientModule ],
    providers: [
        ApiSettings,
        AdminService,
        ConsoleService,
        DocumentService,
        FileService,
        GamespaceService,
        ProfileService,
        TemplateService,
        WorkspaceService,
        VmService
    ]
})
export class ApiModule { }
