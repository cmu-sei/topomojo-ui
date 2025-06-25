// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { ClipboardService } from 'projects/topomojo-work/src/app/clipboard.service';
import { CountdownPipe } from 'projects/topomojo-work/src/app/utility/countdown.pipe';
import { SpinnerComponent } from 'projects/topomojo-work/src/app/utility/spinner/spinner.component';
import { markedOptionsFactory } from './api.service';

import { AppComponent } from './app.component';
import { HttpInterceptorService } from './http-interceptor.service';
import { SpacesPipe } from './spaces.pipe';
import { ConfirmButtonComponent } from './utility/confirm-button/confirm-button.component';

@NgModule({ declarations: [
        AppComponent,
        SpinnerComponent,
        SpacesPipe,
        CountdownPipe,
        ConfirmButtonComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        RouterModule.forRoot([]),
        MarkdownModule.forRoot({
            markedOptions: {
                provide: MarkedOptions,
                useFactory: markedOptionsFactory,
            },
        }),
        FontAwesomeModule], providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpInterceptorService,
            multi: true,
        },
        ClipboardService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
