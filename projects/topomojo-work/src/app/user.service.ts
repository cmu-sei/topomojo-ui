// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, interval, of, Subscription } from 'rxjs';
import { catchError, debounceTime, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { UserRegistration, ApiUser } from './api/gen/models';
import { ProfileService } from './api/profile.service';
import { AuthService, AuthTokenState } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  user$ = new BehaviorSubject<ApiUser | null>(null);
  init$ = new BehaviorSubject<boolean>(false);

  constructor(
    private api: ProfileService,
    private auth: AuthService
  ) {

    // every half hour grab a fresh mks cookie if token still good
    combineLatest([
      interval(1800000),
      this.auth.tokenState$
    ]).pipe(
      map(([i, t]) => t),
      filter(t => t === AuthTokenState.valid),
      ).subscribe(t => {
        this.api.register(
          this.auth.oidcUser?.profile as unknown as UserRegistration,
          this.auth.auth_header()
        );
    });

    const validSub: Subscription = this.auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.valid),
      debounceTime(300),
      switchMap(u => this.api.register(
        this.auth.oidcUser?.profile as UserRegistration,
        this.auth.auth_header()).pipe(
          catchError(err => of(null))
        )
      ),
      tap(() => this.init$.next(true)),
      finalize(() => validSub.unsubscribe())
    ).subscribe(p => this.user$.next(p));

    const invalidSub: Subscription = this.auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.invalid || t === AuthTokenState.expired),
      tap(() => this.init$.next(true)),
      tap(() => this.api.logout()),
      finalize(() => invalidSub.unsubscribe())
    ).subscribe(() => this.user$.next(null));
  }

  // an app initializer to register the user and retrieve the user's profile.
  register(): Promise<void> {
    return new Promise<void>(resolve => {
      this.init$.pipe(
        filter(v => v)
      ).subscribe(() => resolve());
    });
  }

}
