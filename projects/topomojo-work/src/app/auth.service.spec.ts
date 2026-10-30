// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { AuthService, AuthTokenState } from './auth.service';
import { ConfigService, Settings } from './config.service';

describe('AuthService', () => {
  const settings = (authority: string) =>
    ({ oidc: { authority, client_id: 'spec', redirect_uri: 'http://localhost/oidc' } } as unknown as Settings);

  it('waits for loaded settings before reading the token', fakeAsync(() => {
    // settings$ starts with the build-time defaults, as ConfigService does before load()
    const settings$ = new BehaviorSubject<Settings>(settings('http://defaults.spec'));
    TestBed.configureTestingModule({
      providers: [{ provide: ConfigService, useValue: { settings$ } }]
    });

    const auth = TestBed.inject(AuthService);
    flushMicrotasks();

    expect(auth.mgr).toBeUndefined();
    expect(auth.tokenState$.value).toBe(AuthTokenState.unknown);

    settings$.next(settings('https://loaded.spec/realms/x'));
    flushMicrotasks();

    expect(auth.authority).toBe('loaded.spec');
    expect(auth.tokenState$.value).toBe(AuthTokenState.invalid);
  }));
});
