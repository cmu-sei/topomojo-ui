// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ApiSettings } from './api-settings';
import { tap, map } from 'rxjs/operators';
import { GeneratedGamespaceService } from './gen/gamespace.service';
import { GameState, Gamespace, Player, VmState } from './gen/models';

@Injectable()
export class GamespaceService extends GeneratedGamespaceService {

    private gamespaceFavoritesSubject = new BehaviorSubject<Set<string>>(new Set());
    gamespaceFavorites$ = this.gamespaceFavoritesSubject.asObservable();

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings,
      //  private settingsSvc: SettingsService
    ) { super(http, conf); }

    // public openConsole(id, name) {
    //     this.settingsSvc.showTab('/console/' + id + '/' + name.match(/[^#]*/)[0]);
    // }

    public getText(url: string): Observable<string> {
        return this.http.get(url, { responseType: 'text'});
    }

    public listGamespaceFavorites(): Observable<string[]> {
        return this.http.get<string[]>(this.conf.api + '/gamespace-favorites');
    }

    public favoriteGamespace(gamespaceId: string): Observable<void> {
        return this.http.put<void>(this.conf.api + `/gamespace-favorite/${gamespaceId}`, {});
    }

    public unfavoriteGamespace(gamespaceId: string): Observable<void> {
        return this.http.delete<void>(this.conf.api + `/gamespace-favorite/${gamespaceId}`);
    }

    public syncGamespaceFavorites(): Observable<Set<string>> {
        return this.listGamespaceFavorites().pipe(
        map(ids => new Set(ids)),
        tap(set => this.gamespaceFavoritesSubject.next(set))
        );
    }
}
