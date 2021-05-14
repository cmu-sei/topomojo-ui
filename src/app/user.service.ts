// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { catchError, debounce, debounceTime, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { UserRegistration, UserProfile } from './api/gen/models';
import { ProfileService } from './api/profile.service';
import { AuthService, AuthTokenState } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  user$ = new BehaviorSubject<UserProfile | null>(null);

  constructor(
    private api: ProfileService,
    private auth: AuthService
  ) {
  }

  // an app initializer to register the user and retrieve the user's profile.
  register(): void {

    const validSub: Subscription = this.auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.valid),
      map(t => this.auth.oidcUser?.profile),
      switchMap(u => this.api.register(u as UserRegistration, this.auth.auth_header()).pipe(
        catchError(err => of(null))
      )),
      finalize(() => validSub.unsubscribe())
    ).subscribe(p => this.user$.next(p));

    const invalidSub: Subscription = this.auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.invalid || t === AuthTokenState.expired),
      finalize(() => invalidSub.unsubscribe())
    ).subscribe(() => this.user$.next(null));

  }

}
