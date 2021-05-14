// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { GameState, Gamespace, Player, VmState } from './models';

@Injectable()
export class GeneratedGamespaceService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public list(filter: string): Observable<Array<Gamespace>> {
        return this.http.get<Array<Gamespace>>(this.conf.api + '/gamespaces' + this.paramify({filter}));
    }
    public load(id: number): Observable<GameState> {
        return this.http.get<GameState>(this.conf.api + '/gamespace/' + id);
    }
    public delete(id: number): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/gamespace/' + id);
    }
    public create(id: number): Observable<GameState> {
        return this.http.post<GameState>(this.conf.api + '/gamespace/' + id, {});
    }
    public loadState(id: number): Observable<GameState> {
        return this.http.get<GameState>(this.conf.api + '/gamestate/' + id);
    }
    public listPlayers(id: number): Observable<Array<Player>> {
      return this.http.get<Array<Player>>(this.conf.api + '/players/' + id);
    }
    public createPlayer(code: string): Observable<any> {
      return this.http.post<any>(this.conf.api + '/player/' + code, {});
    }
    public deletePlayer(id: number): Observable<any> {
        return this.http.delete<any>(this.conf.api + '/player/' + id);
    }

}
