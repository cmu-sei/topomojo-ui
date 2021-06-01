import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../environments/environment';
import { ConsoleRequest, ConsoleSummary } from './api.models';

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
    return this.http.post<any>(this.url + '/profile/' + token, {});
  }

  ticket(model: ConsoleRequest): Observable<ConsoleSummary> {
    return this.http.post<ConsoleSummary>(this.url + '/console', model);
  }

  power(model: ConsoleRequest): Observable<any> {
    return this.http.put(this.url + '/console/reset', model);
  }
}
