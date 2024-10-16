// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { GameState, Gamespace, Player, GamespaceRegistration, SectionSubmission, Search, TimeWindow, JoinCode, ChallengeProgressView } from './models';
import { map } from 'rxjs/operators';

@Injectable()
export class GeneratedGamespaceService extends GeneratedService {

  constructor(
    protected http: HttpClient,
    protected conf: ApiSettings
  ) { super(http, conf); }

  public list(filter: Search): Observable<Gamespace[]> {
    return this.http.get<Gamespace[]>(this.conf.api + '/gamespaces' + this.paramify(filter)).pipe(
      map(r => {
        r.forEach(g => this.transform(g) as Gamespace);
        return r;
      })
    );
  }
  public preview(id: string): Observable<GameState> {
    return this.http.get<GameState>(`${this.conf.api}/preview/${id}`).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public load(id: string): Observable<GameState> {
    return this.http.get<GameState>(`${this.conf.api}/gamespace/${id}`).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public start(id: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.conf.api}/gamespace/${id}/start`, {}).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public stop(id: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.conf.api}/gamespace/${id}/stop`, {}).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public complete(id: string): Observable<GameState> {
    return this.http.post<GameState>(`${this.conf.api}/gamespace/${id}/complete`, {}).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public delete(id: string): Observable<any> {
    return this.http.delete<any>(`${this.conf.api}/gamespace/${id}`);
  }
  public register(model: GamespaceRegistration): Observable<GameState> {
    return this.http.post<GameState>(`${this.conf.api}/gamespace`, model).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public loadState(id: number): Observable<GameState> {
    return this.http.get<GameState>(`${this.conf.api}/gamespace/${id}`).pipe(
      map(g => this.transform(g) as GameState)
    );
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
  public grade(model: SectionSubmission): Observable<GameState> {
    return this.http.post<GameState>(`${this.conf.api}/gamespace/grade`, model).pipe(
      map(g => this.transform(g) as GameState)
    );
  }
  public challenge(id: string): Observable<any> {
    return this.http.get<any>(`${this.conf.api}/gamespace/${id}/challenge`);
  }

  public getChallengeProgress(gamespaceId: string): Observable<ChallengeProgressView> {
    return this.http.get<ChallengeProgressView>(`${this.conf.api}/gamespace/${gamespaceId}/challenge/progress`);
  }

  public invite(id: string): Observable<JoinCode> {
    return this.http.post<JoinCode>(`${this.conf.api}/gamespace/${id}/invite`, null);
  }

  transform(state: GameState | Gamespace): GameState | Gamespace {
    state.session = new TimeWindow(state.startTime, state.expirationTime);
    state.gameOver = state.session.isAfter || !(state.endTime + '').startsWith('0001-');
    return state;
  }
}
