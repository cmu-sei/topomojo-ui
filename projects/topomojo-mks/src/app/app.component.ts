// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConsoleRequest } from './api.models';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent {
  title = 'topomojo-mks';
  context: Observable<ConsoleRequest>;
  errorMsg = '';

  constructor(
    route: ActivatedRoute,
    api: ApiService
  ) {
    this.context = route.queryParams.pipe(
      debounceTime(500),
      map(p => ({
        name: p.v,
        sessionId: p.s,
        token: p.t,
        fullbleed: p.f
      })),
      switchMap(p => api.redeem(p.token).pipe(
        catchError(err => of(p)),
        map(r => p)
      ))
    );
  }

}
