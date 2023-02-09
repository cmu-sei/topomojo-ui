// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UserManagerSettings } from 'oidc-client-ts';
import { catchError, tap } from 'rxjs/operators';
import { environment } from 'projects/topomojo-work/src/environments/environment';
import { Location, PlatformLocation } from '@angular/common';
import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
// import { MarkedRenderer, MarkedOptions } from 'ngx-markdown';

@Injectable({providedIn: 'root'})
export class ConfigService {

  private restorationComplete = false;
  storageKey = 'topomojo';
  settings: Settings = environment.settings;
  local: LocalAppSettings = {};
  tabs: TabRef[] = [];
  settings$ = new BehaviorSubject<Settings>(this.settings);
  sidebar$ = new Subject<boolean>();
  basehref = '';

  get lastUrl(): string {
    const url = !this.restorationComplete
      ? this.local.last || ''
      : '';
    this.restorationComplete = true;
    return url;
  }

  get currentPath(): string {
    return this.location.path();
  }

  embeddedMonacoOptions = {
    // theme: this.codeTheme,
    language: 'markdown',
    lineNumbers: 'off',
    minimap: { enabled: false },
    // scrollbar: { vertical: 'visible' },
    quickSuggestions: false,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    linkedEditing: true,
    fixedOverflowWidgets: true
  };

  constructor(
    private http: HttpClient,
    private location: Location
  ) {
    this.local = this.getLocal();
  }

  // use setting, or relative
  get apphost(): string {
    const v = this.settings.apphost
      ? this.location.normalize(this.settings.apphost) + '/'
      : ''
    ;
    return v;
  }

  // use setting or assume sibling app 'mks'
  get mkshost(): string {
    return this.settings.mkshost
      ? this.location.normalize(this.settings.mkshost)
      :  'mks'
    ;
  }

  load(): Observable<any> {
    return this.http.get<Settings>('assets/settings.json')
      .pipe(
        catchError((err: Error) => {
          return of({} as Settings);
        }),
        tap(s => {
          this.settings = {...this.settings, ...s};
          this.settings.oidc = {...this.settings.oidc, ...s.oidc};
          this.settings$.next(this.settings);
          // console.log(this.settings);
        })
      );
  }

  externalUrl(path: string): string {
    return `${window.location.protocol}//${window.location.host}${this.location.prepareExternalUrl(path)}`;
  }

  openConsole(qs: string): void {
    this.showTab(this.mkshost + '/' + qs);
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

  updateLocal(model: LocalAppSettings): void {
    this.local = {...this.local, ...model};
    this.storeLocal(this.local);
    this.restorationComplete = true;
  }

  storeLocal(model: LocalAppSettings): void {
    try {
      window.localStorage[this.storageKey] = JSON.stringify(model);
    } catch (e) {
    }
  }
  getLocal(): LocalAppSettings {
    try {
        return JSON.parse(window.localStorage[this.storageKey] || {});
    } catch (e) {
        return {};
    }
  }
  clearStorage(): void {
    try {
        window.localStorage.removeItem(this.storageKey);
    } catch (e) { }
  }
}

export interface LocalAppSettings {
  theme?: string;
  last?: string;
  browseMode?: string;
  browseTerm?: string;
  detail?: boolean;
}

export interface Settings {
  appname?: string;
  apphost?: string;
  mkshost?: string;
  oidc: AppUserManagerSettings;
}

export interface AppUserManagerSettings extends UserManagerSettings {
  useLocalStorage?: boolean;
  silentRenewIfActiveSeconds?: number;
  debug?: boolean;
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
  renderer.table = (header, body) => {
    return `<table class="table table-striped"><thead>${header}</thead><tbody>${body}</tbody></table>`;
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
