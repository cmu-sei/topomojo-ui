// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ConfigService, Settings } from './config.service';

describe('ConfigService', () => {
  let config: ConfigService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    config = TestBed.inject(ConfigService);
    http = TestBed.inject(HttpTestingController);
  });

  it('emits settings only once they are loaded', () => {
    const seen: Settings[] = [];
    config.settings$.subscribe(s => seen.push(s));
    expect(seen.length).toBe(0);

    config.load().subscribe();
    http.expectOne('assets/settings.json').flush({ oidc: { authority: 'https://loaded.spec/realms/x' } });

    expect(seen.length).toBe(1);
    expect(seen[0].oidc.authority).toBe('https://loaded.spec/realms/x');
  });

  it('replays the loaded settings to a later subscriber', () => {
    config.load().subscribe();
    http.expectOne('assets/settings.json').flush({ oidc: { authority: 'https://loaded.spec/realms/x' } });

    const seen: Settings[] = [];
    config.settings$.subscribe(s => seen.push(s));

    expect(seen.length).toBe(1);
    expect(seen[0].oidc.authority).toBe('https://loaded.spec/realms/x');
  });
});
