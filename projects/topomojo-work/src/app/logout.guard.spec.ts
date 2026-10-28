// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { logoutGuard } from './auth.guard';

describe('logoutGuard', () => {
  it('logs out and sends the tab home', () => {
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['logout']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }]
    });

    const result = TestBed.runInInjectionContext(() =>
      logoutGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

    expect(auth.logout).toHaveBeenCalledTimes(1);
    expect((result as UrlTree).toString()).toBe('/');
  });
});
