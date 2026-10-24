// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, computed, DestroyRef, ElementRef, inject, InjectionToken } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ConfigService, HeaderBarSettings } from '../config.service';

// True when the app is framed by another page, which then owns the banner (as in crucible-common).
export const EMBEDDED_IN_FRAME = new InjectionToken<boolean>('EMBEDDED_IN_FRAME', {
  providedIn: 'root',
  factory: () => {
    const view = inject(DOCUMENT).defaultView;
    return !!view && view.top !== view.self;
  }
});

// Height of the rendered banner, for layouts that size themselves against the viewport.
export const BANNER_HEIGHT_PROPERTY = '--classification-banner-height';

export interface ClassificationBanner {
  backgroundColor: string;
  classificationText: string;
  classificationTextColor: string;
  classificationTextFontSize: string;
  messageText: string;
  messageTextColor: string;
  messageTextFontSize: string;
}

// Mirrors crucible-common's comn-header-bar: same HeaderBarSettings keys and defaults.
@Component({
  selector: 'app-classification-banner',
  templateUrl: './classification-banner.component.html',
  styleUrls: ['./classification-banner.component.scss'],
  standalone: false
})
export class ClassificationBannerComponent {
  private readonly settings = toSignal(inject(ConfigService).settings$, { requireSync: true });
  private readonly embedded = inject(EMBEDDED_IN_FRAME);

  protected readonly banner = computed<ClassificationBanner | null>(() =>
    this.embedded ? null : toBanner(this.settings()?.HeaderBarSettings)
  );

  constructor() {
    const host: HTMLElement = inject(ElementRef).nativeElement;
    const root = inject(DOCUMENT).documentElement;
    // Fires on observe and on every size change: the banner appearing or going away, text wrapping
    // on a narrow window, or the web font swapping in.
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => root.style.setProperty(BANNER_HEIGHT_PROPERTY, `${host.getBoundingClientRect().height}px`));

    observer?.observe(host);
    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
      root.style.removeProperty(BANNER_HEIGHT_PROPERTY);
    });
  }
}

export function toBanner(settings: HeaderBarSettings | null | undefined): ClassificationBanner | null {
  if (!settings?.enabled) {
    return null;
  }

  const banner: ClassificationBanner = {
    backgroundColor: orDefault(settings.banner_background_color, '#d40000ff'),
    classificationText: orDefault(settings.classification_text, ''),
    classificationTextColor: orDefault(settings.classification_text_color, '#ffffff'),
    classificationTextFontSize: fontSize(settings.classification_text_fontsize, '22'),
    messageText: orDefault(settings.message_text, ''),
    messageTextColor: orDefault(settings.message_text_color, '#ffffff'),
    messageTextFontSize: fontSize(settings.message_text_fontsize, '18')
  };

  return banner.classificationText || banner.messageText ? banner : null;
}

// Blank or missing values take the default.
function orDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

// Sizes are pixels, as in crucible-common; a bare number (string or not) gets "px", anything with
// a unit is passed through.
function fontSize(value: unknown, fallback: string): string {
  const size = typeof value === 'number' && Number.isFinite(value) ? String(value) : orDefault(value, fallback).trim();
  return /^\d+(\.\d+)?$/.test(size) ? `${size}px` : size;
}
