// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, ActivatedRoute } from '@angular/router';
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
