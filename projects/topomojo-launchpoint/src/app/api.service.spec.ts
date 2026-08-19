// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClient } from '@angular/common/http';
import { PlatformLocation } from '@angular/common';
import { ApiService } from './api.service';

describe('ApiService', () => {
  it('opens ConsoleForge through the application-relative console route', () => {
    const location = {
      getBaseHrefFromDOM: () => '/topomojo/lp/'
    } as PlatformLocation;
    const service = new ApiService({} as HttpClient, location);
    const open = spyOn(window, 'open');

    service.openConsole('workstation 1', 'gamespace-1');

    expect(open).toHaveBeenCalledWith(
      '/topomojo/c?name=workstation+1&sessionId=gamespace-1'
    );
  });
});
