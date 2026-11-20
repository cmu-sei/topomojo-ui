// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { ApiSettings } from './api/api-settings';
import { AppComponent } from './app.component';
import { ClassificationBannerComponent } from './classification-banner/classification-banner.component';
import { ConfigService, Settings } from './config.service';
import { ThemeService } from './theme.service';

describe('AppComponent', () => {
  const settings = { oidc: {} } as Settings;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ClassificationBannerComponent
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { settings, settings$: new BehaviorSubject<Settings>(settings) } },
        { provide: ApiSettings, useValue: { api: '/api' } },
        { provide: ThemeService, useValue: { setTheme: () => { } } }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).match(() => true);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'topomojo-work'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('topomojo-work');
  });

  it('should render the classification banner above the app content', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const banner = root.querySelector('app-classification-banner');
    const content = root.querySelector('.app-content');

    expect(banner).toBeTruthy();
    expect(content).toBeTruthy();
    expect(content!.querySelector('router-outlet')).toBeTruthy();
    expect(banner!.compareDocumentPosition(content!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
