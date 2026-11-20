// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComnHeaderBarComponent, ComnHeaderBarSettings } from '@cmusei/crucible-common/header-bar';
import { catchError, map, of } from 'rxjs';

// Launchpoint is served under /lp/ beside the main app, so the main app's settings.json is one
// level up from this app's base href. The banner then matches what topomojo-work shows.
export const SETTINGS_URL = '../assets/settings.json';

// crucible-common's banner, fed from TopoMojo's HeaderBarSettings. Players open gamespaces from
// here, so it needs the same classification marking as the main app. No settings means no banner.
@Component({
  selector: 'app-classification-banner',
  template: '<comn-header-bar [settings]="settings()"></comn-header-bar>',
  styleUrls: ['./classification-banner.component.scss'],
  imports: [ComnHeaderBarComponent]
})
export class ClassificationBannerComponent {
  protected readonly settings = toSignal(
    inject(HttpClient).get<{ HeaderBarSettings?: Partial<ComnHeaderBarSettings> }>(SETTINGS_URL).pipe(
      map(s => (s?.HeaderBarSettings ?? {}) as ComnHeaderBarSettings),
      catchError(() => of({} as ComnHeaderBarSettings))
    ),
    { initialValue: {} as ComnHeaderBarSettings }
  );
}
