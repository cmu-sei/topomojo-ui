import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';
import { ConsoleRequest, ConsoleSummary, VmOperation } from './api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  url = '';

  constructor(
    private http: HttpClient
  ) {
    this.url = environment.apiUrl || '/api';
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
}
