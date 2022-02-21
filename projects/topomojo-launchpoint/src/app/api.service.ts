// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Enlistee, Enlistment, GameState, JoinCode, TabRef } from './api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = '';
  mks = '';
  tabs: TabRef[] = [];

  constructor(
    private http: HttpClient,
    loc: PlatformLocation
  ) {
    const target = loc.getBaseHrefFromDOM();
    const basehref = target.split('/').slice(0, -2).join('/');
    this.url = environment.apiUrl || `${basehref}/api`;
    this.mks = environment.mksUrl || `${basehref}/mks`;
  }

  login(ticket: string): Observable<any> {
    return this.http.post(this.url + `/user/login`, {}, { headers: { authorization: `ticket ${ticket}`} });
  }
  launch(id: string): Observable<GameState> {
    return this.http.get<GameState>(this.url + `/gamespace/${id}`);
  }
  start(id: string): Observable<GameState> {
    return this.http.post<GameState>(this.url + `/gamespace/${id}/start`, null);
  }
  stop(id: string): Observable<GameState> {
    return this.http.post<GameState>(this.url + `/gamespace/${id}/stop`, null);
  }
  complete(id: string): Observable<GameState> {
    return this.http.post<GameState>(this.url + `/gamespace/${id}/complete`, null);
  }
  delete(id: string): Observable<any> {
    return this.http.delete<any>(this.url + `/gamespace/${id}`);
  }
  invite(id: string): Observable<JoinCode> {
    return this.http.post<JoinCode>(this.url + `/gamespace/${id}/invite`, null);
  }
  enlist(model: Enlistee): Observable<Enlistment> {
    return this.http.put<Enlistment>(this.url + `/player/enlist`, model);
  }
  openConsole(qs: string): void {
    this.showTab(this.mks + qs);
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
