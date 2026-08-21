// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { environment } from '../environments/environment';
import { ApiService } from './api.service';

describe('ApiService', () => {
  it('opens ConsoleForge through the work UI console route', () => {
    const location = {
      getBaseHrefFromDOM: () => '/topomojo/lp/'
    } as PlatformLocation;
    const service = new ApiService({} as HttpClient, location);
    const open = spyOn(window, 'open');

    service.openConsole('workstation 1', 'gamespace-1');

    expect(open).toHaveBeenCalledWith(
      'http://localhost:4201/c?name=workstation+1&sessionId=gamespace-1'
    );
  });

  it('falls back to the application-relative console route', () => {
    const configuredMksUrl = environment.mksUrl;
    environment.mksUrl = '';

    try {
      const location = {
        getBaseHrefFromDOM: () => '/topomojo/lp/'
      } as PlatformLocation;
      const service = new ApiService({} as HttpClient, location);
      const open = spyOn(window, 'open');

      service.openConsole('workstation 1', 'gamespace-1');

      expect(open).toHaveBeenCalledWith(
        '/topomojo/c?name=workstation+1&sessionId=gamespace-1'
      );
    } finally {
      environment.mksUrl = configuredMksUrl;
    }
  });
});
