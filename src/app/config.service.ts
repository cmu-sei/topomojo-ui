// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserManagerSettings } from 'oidc-client';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PlatformLocation } from '@angular/common';
import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
// import { MarkedRenderer, MarkedOptions } from 'ngx-markdown';

@Injectable({providedIn: 'root'})
export class ConfigService {

  private url = 'assets/settings.json';
  basehref = '';
  settings: Settings = environment.settings;
  absoluteUrl = '';
  tabs: TabRef[] = [];

  constructor(
    private http: HttpClient,
    platform: PlatformLocation
  ) {
    this.basehref = platform.getBaseHrefFromDOM();
    this.absoluteUrl = `${window.location.protocol}//${window.location.host}${this.basehref}`;
  }

  get apihost(): string {
    let path = this.settings.apphost || this.basehref;
    if (!path.endsWith('/')) {
      path += '/';
    }
    return path;
  }

  public load(): void {
    this.http.get<Settings>(this.basehref + this.url)
      .pipe(
        catchError((err: Error) => {
          return of({} as Settings);
        })
      )
      .subscribe((s: Settings) => {
        this.settings = {...this.settings, ...s};
        this.settings.oidc = {...this.settings.oidc, ...s.oidc};
      });
  }

  showTab(url: string): void {
    let item = this.tabs.find(t => t.url === url);

    if (!item) {
      item = {url, window: null};
      this.tabs.push(item);
    }

    if (!item.window || item.window.closed) {
        item.window = window.open(url);
    } else {
        item.window.focus();
    }
  }

}

export interface Settings {
  appname?: string;
  apphost?: string;
  oidc: AppUserManagerSettings;
}

export interface AppUserManagerSettings extends UserManagerSettings {
  useLocalStorage?: boolean;
}

export interface TabRef {
  url: string;
  window: Window | null;
}

export function markedOptionsFactory(): MarkedOptions {
  const renderer = new MarkedRenderer();

  renderer.image = (href, title, text) => {
    return `<div class="text-center"><img class="img-fluid rounded" src=${href} alt="${text}" /></div>`;
  };
  renderer.blockquote = (quote) => {
    return `<blockquote class="blockquote">${quote}</blockquote>`;
  };

  return {
    renderer,
    gfm: true,
    breaks: false,
    pedantic: false,
    smartLists: true,
    smartypants: false
  };
}
