// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, ActivatedRoute, CanActivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService, AuthTokenState } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {
  constructor(
    private auth: AuthService,
    private router: Router
  ){}

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this.validateAuth(state);
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.validateAuth(state);
  }

  private validateAuth(state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.auth.tokenState$.pipe(
      map(t => t === AuthTokenState.valid),
      tap(v => this.auth.redirectUrl = v ? this.auth.redirectUrl : state.url),
      map(v => v ? v : this.router.parseUrl(
        state.url !== '/' ? '/login' : '/'
      ))
    );
  }
}

// Gives Logout a real URL so it can open in a new tab. Route it under AuthGuard, which runs first,
// so a new tab has loaded the user before logout() checks for one.
export const logoutGuard: CanActivateFn = () => {
  inject(AuthService).logout();
  return inject(Router).parseUrl('/');
};
