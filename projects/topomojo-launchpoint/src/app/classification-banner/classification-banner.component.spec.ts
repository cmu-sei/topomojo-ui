// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { DOCUMENT } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ComnHeaderBarComponent } from '@cmusei/crucible-common/header-bar';
import { ClassificationBannerComponent, SETTINGS_URL } from './classification-banner.component';

describe('Launchpoint ClassificationBannerComponent', () => {
  let http: HttpTestingController;

  // Karma runs specs in an iframe, where the library hides the banner; hand it an unframed window.
  function create() {
    const view = { self: {}, top: {} };
    view.top = view.self;
    TestBed.configureTestingModule({
      imports: [ClassificationBannerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    TestBed.overrideComponent(ComnHeaderBarComponent, {
      add: { providers: [{ provide: DOCUMENT, useValue: { defaultView: view } }] }
    });
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ClassificationBannerComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('reads the main app settings and shows the configured text', async () => {
    const fixture = create();
    http.expectOne(SETTINGS_URL).flush({
      HeaderBarSettings: { enabled: true, classification_text: 'UNCLASSIFIED // TRAINING' }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('UNCLASSIFIED // TRAINING');
  });

  it('shows nothing when the settings are missing', async () => {
    const fixture = create();
    http.expectOne(SETTINGS_URL).flush('', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });
});
