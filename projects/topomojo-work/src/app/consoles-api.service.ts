import { PlatformLocation } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, interval, map, Observable, of, switchMap } from 'rxjs';
import { ConsoleRequest, ConsoleSummary, KeyValuePair, VmAnswer, VmOperation, VmOptions } from './consoles-api.models';
import { ApiSettings } from './api/api-settings';

@Injectable({ providedIn: 'root' })
export class ConsolesApiService {
  url = '';
  heartbeat$: Observable<boolean>;
  private readonly apiSettings = inject(ApiSettings);

  constructor(
    private http: HttpClient,
    platform: PlatformLocation
  ) {
    const target = platform.getBaseHrefFromDOM();
    const basehref = target.split('/').slice(0, -2).join('/');
    this.url = this.apiSettings.api;

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
