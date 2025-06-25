// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app.component';
import { HttpInterceptorService } from './http-interceptor.service';
import { RouterModule } from '@angular/router';
import { SpacesPipe } from './spaces.pipe';
import { ConsoleComponent } from './console/console.component';
import { ClipboardService } from './clipboard.service';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { SpinnerComponent } from './spinner/spinner.component';

@NgModule({ declarations: [
        AppComponent,
        SpacesPipe,
        ConsoleComponent,
        SpinnerComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        RouterModule.forRoot([], {}),
        MarkdownModule.forRoot()], providers: [
        ClipboardService,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: HttpInterceptorService,
            multi: true,
        },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
