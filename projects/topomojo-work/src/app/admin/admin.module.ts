// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AdminComponent } from './admin/admin.component';
import { GamespaceBrowserComponent } from './gamespace-browser/gamespace-browser.component';
import { WorkspaceBrowserComponent } from './workspace-browser/workspace-browser.component';
import { TemplateBrowserComponent } from './template-browser/template-browser.component';
import { VmBrowserComponent } from './vm-browser/vm-browser.component';
import { UtilityModule } from '../utility/utility.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { TemplateDetailFormComponent } from './template-detail-form/template-detail-form.component';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { UserBrowserComponent } from './user-browser/user-browser.component';
import { ApikeysComponent } from './apikeys/apikeys.component';
import { LogViewerComponent } from './log-viewer/log-viewer.component';
import { ObserveComponent } from './observe/observe.component';

@NgModule({
  declarations: [
    AdminComponent,
    DashboardComponent,
    GamespaceBrowserComponent,
    WorkspaceBrowserComponent,
    TemplateBrowserComponent,
    VmBrowserComponent,
    TemplateDetailFormComponent,
    UserBrowserComponent,
    ApikeysComponent,
    LogViewerComponent,
    ObserveComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    RouterModule.forChild([
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: ':section', component: AdminComponent },
      { path: '**', component: AdminComponent }
    ]),
    UtilityModule,
    FontAwesomeModule,
    ButtonsModule.forRoot()
  ]
})
export class AdminModule { }
