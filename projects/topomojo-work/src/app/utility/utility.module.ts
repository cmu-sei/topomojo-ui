// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgedDatePipe } from './aged-date.pipe';
import { ShortDatePipe } from './short-date.pipe';
import { CamelspacePipe } from './camelspace.pipe';
import { ConfirmButtonComponent } from './confirm-button/confirm-button.component';
import { ErrorDivComponent } from './error-div/error-div.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AlertModule } from 'ngx-bootstrap/alert';
import { SpinnerComponent } from './spinner/spinner.component';
import { VmControllerComponent } from './vm-controller/vm-controller.component';
import { UntagPipe } from './untag.pipe';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ClipspanComponent } from './clipspan/clipspan.component';
import { CountdownPipe } from './countdown.pipe';
import { ClockPipe } from './clock.pipe';



@NgModule({
  declarations: [
    AgedDatePipe,
    ShortDatePipe,
    CamelspacePipe,
    UntagPipe,
    ConfirmButtonComponent,
    ErrorDivComponent,
    SpinnerComponent,
    VmControllerComponent,
    ClipspanComponent,
    CountdownPipe,
    ClockPipe
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    AlertModule.forRoot(),
    TooltipModule.forRoot()
  ],
  exports: [
    AgedDatePipe,
    ShortDatePipe,
    CamelspacePipe,
    UntagPipe,
    ConfirmButtonComponent,
    ErrorDivComponent,
    SpinnerComponent,
    VmControllerComponent,
    ClipspanComponent,
    CountdownPipe,
    ClockPipe
  ]
})
export class UtilityModule { }
