// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, of, timer } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { UserRegistration, ApiUser } from './api/gen/models';
import { ProfileService } from './api/profile.service';
import { AuthService, AuthTokenState } from './auth.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  user$ = new BehaviorSubject<ApiUser | null>(null);
  init$ = new BehaviorSubject<boolean>(false);

  constructor(
    api: ProfileService,
    auth: AuthService,
    config: ConfigService,
    router: Router
  ) {

    // every half hour grab a fresh mks cookie if token still good
    combineLatest([
      timer(1000, 1800000),
      auth.tokenState$
    ]).pipe(
      map(([i, t]) => t),
      filter(t => t === AuthTokenState.valid),
      switchMap(u => api.register(
        auth.oidcUser?.profile as UserRegistration,
        auth.auth_header()).pipe(
          catchError(err => of(null))
        )
      ),
      tap(() => this.init$.next(true)),
    ).subscribe(p => this.user$.next(p));

    auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.invalid),
      tap(() => this.init$.next(true)),
    ).subscribe(() => this.user$.next(null));

    auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.expired),
      tap(() => auth.redirectUrl = config.currentPath),
      switchMap(() => api.logout()),
      // tap(() => console.log('token expired'))
    ).subscribe(() => {
      this.user$.next(null);
      router.navigate(['/login']);
    });
  }

  // an app initializer to register the user and retrieve the user's profile.
  register(): Promise<void> {
    return new Promise<void>(resolve => {
      this.init$.pipe(
        tap(v => console.log(`user init: ${v}`)),
        filter(v => v)
      ).subscribe(() => resolve());
    });
  }

}
