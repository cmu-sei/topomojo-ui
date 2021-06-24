// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { GameState, Gamespace, Player, VmState, ChallengeView, GamespaceRegistration, SectionSubmission, Search } from './models';

@Injectable()
export class GeneratedGamespaceService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected conf: ApiSettings
    ) { super(http, conf); }

    public list(filter: Search): Observable<Gamespace[]> {
        return this.http.get<Gamespace[]>(this.conf.api + '/gamespaces' + this.paramify(filter));
    }
    public preview(id: string): Observable<GameState> {
        return this.http.get<GameState>(`${this.conf.api}/preview/${id}`);
    }
    public load(id: string): Observable<GameState> {
        return this.http.get<GameState>(`${this.conf.api}/gamespace/${id}`);
    }
    public start(id: string): Observable<GameState> {
        return this.http.post<GameState>(`${this.conf.api}/gamespace/${id}/start`, {});
    }
    public stop(id: string): Observable<GameState> {
        return this.http.post<GameState>(`${this.conf.api}/gamespace/${id}/stop`, {});
    }
    public complete(id: string): Observable<GameState> {
        return this.http.post<GameState>(`${this.conf.api}/gamespace/${id}/complete`, {});
    }
    public delete(id: string): Observable<any> {
        return this.http.delete<any>(`${this.conf.api}/gamespace/${id}`);
    }
    public register(model: GamespaceRegistration): Observable<GameState> {
        return this.http.post<GameState>(`${this.conf.api}/gamespace`, model);
    }
    public loadState(id: number): Observable<GameState> {
        return this.http.get<GameState>(`${this.conf.api}/gamespace/${id}`);
    }
    public listPlayers(id: number): Observable<Array<Player>> {
      return this.http.get<Array<Player>>(this.conf.api + '/players/' + id);
    }
    public createPlayer(code: string): Observable<any> {
      return this.http.post<any>(this.conf.api + '/player/' + code, {});
    }
    public deletePlayer(player: Player): Observable<any> {
        return this.http.delete<any>(this.conf.api + `/gamespace/${player.gamespaceId}/player/${player.subjectId}`);
    }
    public grade(id: string, model: SectionSubmission): Observable<ChallengeView> {
      return this.http.post<ChallengeView>(`${this.conf.api}/gamespace/${id}/grade`, model);
    }
}
