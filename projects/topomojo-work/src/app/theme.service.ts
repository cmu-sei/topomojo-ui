// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Same values as the other Crucible apps' ?theme= query param.
export type Theme = 'light-theme' | 'dark-theme';

// Resolves the theme from a saved choice (toggle or ?theme= param),
// falling back to the OS preference, and applies it to <html>.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  // Also read by assets/theme-init.js before the app boots.
  private readonly THEME_KEY = 'topomojo.theme';
  private readonly osDark: MediaQueryList;
  theme$: BehaviorSubject<Theme>;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.osDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.theme$ = new BehaviorSubject<Theme>(this.saved() ?? this.osTheme());
    this.theme$.subscribe(t => this.apply(t));

    this.osDark.addEventListener('change', () => {
      if (!this.saved()) {
        this.theme$.next(this.osTheme());
      }
    });
  }

  get isDark(): boolean {
    return this.theme$.value === 'dark-theme';
  }

  // Unknown values are ignored, as in assets/theme-init.js.
  setTheme(theme: string): void {
    if (theme !== 'dark-theme' && theme !== 'light-theme') {
      return;
    }
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (e) { }
    this.theme$.next(theme);
  }

  toggle(): void {
    this.setTheme(this.isDark ? 'light-theme' : 'dark-theme');
  }

  private saved(): Theme | null {
    try {
      const t = localStorage.getItem(this.THEME_KEY);
      return t === 'dark-theme' || t === 'light-theme' ? t : null;
    } catch (e) {
      return null;
    }
  }

  private osTheme(): Theme {
    return this.osDark.matches ? 'dark-theme' : 'light-theme';
  }

  private apply(theme: Theme): void {
    this.document.documentElement.classList.toggle('dark-theme', theme === 'dark-theme');
    applyMonacoTheme();
  }
}

// Monaco's theme is global; it loads lazily, so this also runs from MonacoEditorModule's onMonacoLoad.
export function applyMonacoTheme(): void {
  const dark = document.documentElement.classList.contains('dark-theme');
  (window as any).monaco?.editor?.setTheme(dark ? 'vs-dark' : 'vs');
}
