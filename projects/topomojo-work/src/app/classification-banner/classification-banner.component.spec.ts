// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComnHeaderBarComponent, ComnHeaderBarSettings } from '@cmusei/crucible-common/header-bar';
import { BehaviorSubject } from 'rxjs';
import { ConfigService, Settings } from '../config.service';
import { BANNER_HEIGHT_PROPERTY, ClassificationBannerComponent } from './classification-banner.component';

const sharedSettings: ComnHeaderBarSettings = {
  enabled: true,
  banner_background_color: '#007a33ff',
  classification_text: 'UNCLASSIFIED // FOR TRAINING USE ONLY',
  classification_text_color: '#ffffff',
  classification_text_fontsize: '14',
  message_text: 'LOCAL DEVELOPMENT',
  message_text_color: '#ffff00',
  message_text_fontsize: '14'
};

function settingsWith(headerBar?: Partial<ComnHeaderBarSettings>): Settings {
  return { oidc: {} as Settings['oidc'], HeaderBarSettings: headerBar };
}

// The library covers its own defaults; these cover TopoMojo's wiring.
describe('ClassificationBannerComponent', () => {
  let settings$: BehaviorSubject<Settings>;
  let fixture: ComponentFixture<ClassificationBannerComponent>;

  // Karma runs specs in an iframe, where the library hides the banner, so its component gets a
  // document whose window is (or isn't) framed.
  function create(framed = false): HTMLElement {
    const view = { self: {}, top: {} };
    if (!framed) {
      view.top = view.self;
    }
    TestBed.configureTestingModule({
      imports: [ClassificationBannerComponent],
      providers: [{ provide: ConfigService, useValue: { settings$ } }]
    });
    TestBed.overrideComponent(ComnHeaderBarComponent, {
      add: { providers: [{ provide: DOCUMENT, useValue: { defaultView: view } }] }
    });
    fixture = TestBed.createComponent(ClassificationBannerComponent);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  function nextResize(): Promise<void> {
    return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve)));
  }

  beforeEach(() => {
    settings$ = new BehaviorSubject<Settings>(settingsWith(sharedSettings));
  });

  afterEach(() => {
    document.documentElement.style.removeProperty(BANNER_HEIGHT_PROPERTY);
  });

  it('renders the library banner from HeaderBarSettings', () => {
    const bar = create().querySelector<HTMLElement>('comn-header-bar .message-bar');
    const lines = bar?.querySelectorAll<HTMLElement>(':scope > div') ?? [];

    expect(bar?.style.backgroundColor).toBe('rgb(0, 122, 51)');
    expect(lines.length).toBe(2);
    expect(lines[0].textContent?.trim()).toBe('UNCLASSIFIED // FOR TRAINING USE ONLY');
    expect(lines[0].style.fontSize).toBe('14px');
    expect(lines[1].textContent?.trim()).toBe('LOCAL DEVELOPMENT');
    expect(lines[1].style.color).toBe('rgb(255, 255, 0)');
  });

  it('renders nothing when the setting is absent', () => {
    settings$.next(settingsWith(undefined));
    expect(create().querySelector('.message-bar')).toBeNull();
  });

  it('renders nothing inside a frame', () => {
    expect(create(true).querySelector('.message-bar')).toBeNull();
  });

  it('follows settings changes', () => {
    const host = create();
    settings$.next(settingsWith({ ...sharedSettings, enabled: false }));
    fixture.detectChanges();
    expect(host.querySelector('.message-bar')).toBeNull();

    settings$.next(settingsWith(sharedSettings));
    fixture.detectChanges();
    expect(host.querySelector('.message-bar')).not.toBeNull();
  });

  it('uses normal line height whatever the page sets', () => {
    document.body.style.lineHeight = '1.5';
    try {
      expect(getComputedStyle(create()).lineHeight).toBe('normal');
    } finally {
      document.body.style.removeProperty('line-height');
    }
  });

  it('publishes its height for viewport-sized layouts and clears it when destroyed', async () => {
    const host = create();
    await nextResize();

    const root = document.documentElement.style;
    const height = host.getBoundingClientRect().height;
    expect(height).toBeGreaterThan(0);
    expect(root.getPropertyValue(BANNER_HEIGHT_PROPERTY)).toBe(`${height}px`);

    settings$.next(settingsWith(undefined));
    fixture.detectChanges();
    await nextResize();
    expect(root.getPropertyValue(BANNER_HEIGHT_PROPERTY)).toBe('0px');

    fixture.destroy();
    expect(root.getPropertyValue(BANNER_HEIGHT_PROPERTY)).toBe('');
  });
});
