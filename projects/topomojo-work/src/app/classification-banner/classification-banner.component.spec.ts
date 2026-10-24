// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ConfigService, HeaderBarSettings, Settings } from '../config.service';
import {
  BANNER_HEIGHT_PROPERTY,
  ClassificationBannerComponent,
  EMBEDDED_IN_FRAME,
  toBanner
} from './classification-banner.component';

const sharedSettings: HeaderBarSettings = {
  enabled: true,
  banner_background_color: '#007a33ff',
  classification_text: 'UNCLASSIFIED // FOR TRAINING USE ONLY',
  classification_text_color: '#ffffff',
  classification_text_fontsize: '14',
  message_text: 'LOCAL DEVELOPMENT',
  message_text_color: '#ffff00',
  message_text_fontsize: '14'
};

function settingsWith(headerBar?: HeaderBarSettings): Settings {
  return { oidc: {} as Settings['oidc'], HeaderBarSettings: headerBar };
}

describe('toBanner', () => {
  it('is hidden when the setting is absent or disabled', () => {
    expect(toBanner(undefined)).toBeNull();
    expect(toBanner(null)).toBeNull();
    expect(toBanner({})).toBeNull();
    expect(toBanner({ ...sharedSettings, enabled: false })).toBeNull();
  });

  it('is hidden when enabled with no text', () => {
    expect(toBanner({ enabled: true, classification_text: ' ', message_text: '' })).toBeNull();
  });

  it('uses the configured values', () => {
    expect(toBanner(sharedSettings)).toEqual({
      backgroundColor: '#007a33ff',
      classificationText: 'UNCLASSIFIED // FOR TRAINING USE ONLY',
      classificationTextColor: '#ffffff',
      classificationTextFontSize: '14px',
      messageText: 'LOCAL DEVELOPMENT',
      messageTextColor: '#ffff00',
      messageTextFontSize: '14px'
    });
  });

  it('falls back to the crucible-common defaults for blank values', () => {
    expect(toBanner({ enabled: true, classification_text: 'UNCLASSIFIED', banner_background_color: ' ' })).toEqual({
      backgroundColor: '#d40000ff',
      classificationText: 'UNCLASSIFIED',
      classificationTextColor: '#ffffff',
      classificationTextFontSize: '22px',
      messageText: '',
      messageTextColor: '#ffffff',
      messageTextFontSize: '18px'
    });
  });

  it('treats bare font sizes as pixels and keeps explicit units', () => {
    const banner = toBanner({
      enabled: true,
      classification_text: 'UNCLASSIFIED',
      classification_text_fontsize: 16 as unknown as string,
      message_text_fontsize: '1rem'
    });
    expect(banner?.classificationTextFontSize).toBe('16px');
    expect(banner?.messageTextFontSize).toBe('1rem');
    expect(toBanner({ ...sharedSettings, message_text_fontsize: '12px' })?.messageTextFontSize).toBe('12px');
  });
});

describe('ClassificationBannerComponent', () => {
  let settings$: BehaviorSubject<Settings>;
  let fixture: ComponentFixture<ClassificationBannerComponent>;

  function create(embedded = false): HTMLElement {
    TestBed.configureTestingModule({
      declarations: [ClassificationBannerComponent],
      providers: [
        { provide: ConfigService, useValue: { settings$ } },
        { provide: EMBEDDED_IN_FRAME, useValue: embedded }
      ]
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

  it('renders the classification and message with their colors and sizes', () => {
    const lines = create().querySelectorAll<HTMLElement>('.message-bar > div');

    expect(lines.length).toBe(2);
    expect(lines[0].textContent?.trim()).toBe('UNCLASSIFIED // FOR TRAINING USE ONLY');
    expect(lines[0].style.color).toBe('rgb(255, 255, 255)');
    expect(lines[0].style.fontSize).toBe('14px');
    expect(lines[1].textContent?.trim()).toBe('LOCAL DEVELOPMENT');
    expect(lines[1].style.color).toBe('rgb(255, 255, 0)');
  });

  it('applies the banner background color', () => {
    const bar = create().querySelector<HTMLElement>('.message-bar');
    expect(bar?.style.backgroundColor).toBe('rgb(0, 122, 51)');
  });

  it('omits an empty message line', () => {
    settings$.next(settingsWith({ ...sharedSettings, message_text: '' }));
    expect(create().querySelectorAll('.message-bar > div').length).toBe(1);
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
