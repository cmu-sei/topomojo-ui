// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { interval, Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { ConsoleRequest, ConsoleSummary, KeyValuePair, VmAnswer, VmOperation, VmOptions } from './api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = '';
  heartbeat$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    platform: PlatformLocation
  ) {
    const target = platform.getBaseHrefFromDOM();
    const basehref = target.split('/').slice(0, -2).join('/');
    this.url = environment.apiUrl || `${basehref}/api`;

    this.heartbeat$ = interval(60000).pipe(
      switchMap(() => this.ping().pipe(
        map(() => true),
        catchError(err => of(false))
      ))
    );
  }

  redeem(token: string): Observable<any> {
    return this.http.post<any>(this.url + '/user/login?ticket=' + token, {});
  }

  ticket(model: ConsoleRequest): Observable<ConsoleSummary> {
    return this.http.get<ConsoleSummary>(this.url + `/vm-console/${model.name}%23${model.sessionId}`);
  }

  power(model: VmOperation): Observable<any> {
    return this.http.put(this.url + '/vm', model);
  }

  update(id: string, change: KeyValuePair): Observable<any> {
    return this.http.put<any>(this.url + '/vm/' + id + '/change', change);
  }

  answer(id: string, answer: VmAnswer): Observable<any> {
    return this.http.put<any>(this.url + '/vm/' + id + '/answer', answer);
  }

  isos(id: string): Observable<VmOptions> {
    return this.http.get<VmOptions>(this.url + '/vm/' + id + '/isos');
  }

  nets(id: string): Observable<VmOptions> {
    return this.http.get<VmOptions>(this.url + '/vm/' + id + '/nets');
  }

  ping(): Observable<any> {
    return this.http.get<any>(this.url + '/user/ping');
  }
}
