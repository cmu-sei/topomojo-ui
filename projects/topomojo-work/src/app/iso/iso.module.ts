// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IsoManagerComponent } from '../iso-manager/iso-manager.component';
import { IsoSelectorComponent } from '../iso-selector/iso-selector.component';
import { DropzoneComponent } from '../dropzone/dropzone.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { UtilityModule } from '../utility/utility.module';

@NgModule({
  declarations: [
    IsoManagerComponent,
    IsoSelectorComponent,
    DropzoneComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    ProgressbarModule,
    TooltipModule,
    ButtonsModule,
    UtilityModule
  ],
  exports: [
    IsoManagerComponent,
    IsoSelectorComponent,
    DropzoneComponent
  ]
})
export class IsoModule { }
