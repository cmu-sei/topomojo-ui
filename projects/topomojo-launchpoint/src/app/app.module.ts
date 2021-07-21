// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MarkdownModule, MarkedOptions } from 'ngx-markdown';
import { CountdownPipe } from 'projects/topomojo-work/src/app/utility/countdown.pipe';
import { SpinnerComponent } from 'projects/topomojo-work/src/app/utility/spinner/spinner.component';
import { markedOptionsFactory } from './api.service';

import { AppComponent } from './app.component';
import { HttpInterceptorService } from './http-interceptor.service';
import { SpacesPipe } from './spaces.pipe';

@NgModule({
  declarations: [
    AppComponent,
    SpinnerComponent,
    SpacesPipe,
    CountdownPipe
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([]),
    MarkdownModule.forRoot({
      markedOptions: {
        provide: MarkedOptions,
        useFactory: markedOptionsFactory,
      },
    }),
    FontAwesomeModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
