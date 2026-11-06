// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, computed, DestroyRef, ElementRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComnHeaderBarComponent, ComnHeaderBarSettings } from '@cmusei/crucible-common/header-bar';
import { ConfigService } from '../config.service';

// Height of the rendered banner, for layouts that size themselves against the viewport.
export const BANNER_HEIGHT_PROPERTY = '--classification-banner-height';

// crucible-common's banner, fed from TopoMojo's settings. The library does the rendering, the
// defaults and hiding it when framed; this adds the banner height for the viewport-sized layouts.
@Component({
  selector: 'app-classification-banner',
  template: '<comn-header-bar [settings]="settings()"></comn-header-bar>',
  styleUrls: ['./classification-banner.component.scss'],
  imports: [ComnHeaderBarComponent]
})
export class ClassificationBannerComponent {
  private readonly appSettings = toSignal(inject(ConfigService).settings$, { requireSync: true });

  // The library reads each key with a default, so a partial or missing block is fine.
  protected readonly settings = computed(
    () => (this.appSettings()?.HeaderBarSettings ?? {}) as ComnHeaderBarSettings
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
