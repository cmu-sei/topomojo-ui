// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
// tslint:disable-next-line:max-line-length
import { ConsoleSummary, KeyValuePair, Vm, VmAnswer, VmOperation, VmOperationTypeEnum, VmOptions, VmQuestion, VmStateEnum, VmTask } from './models';

@Injectable()
export class GeneratedVmService extends GeneratedService {

  constructor(
    protected http: HttpClient,
    protected conf: ApiSettings
  ) { super(http, conf); }

  public list(filter: string): Observable<Array<Vm>> {
    return this.http.get<Array<Vm>>(this.conf.api + '/vms' + this.paramify({ filter }));
  }
  public load(id: string): Observable<Vm> {
    return this.http.get<Vm>(this.conf.api + '/vm/' + id);
  }
  public delete(id: string): Observable<Vm> {
    return this.http.delete<Vm>(this.conf.api + '/vm/' + id);
  }
  public updateState(op: VmOperation): Observable<Vm> {
    return this.http.put<Vm>(this.conf.api + '/vm', op);
  }
  public updateConfig(id: string, change: KeyValuePair): Observable<Vm> {
    return this.http.put<Vm>(this.conf.api + '/vm/' + id + '/change', change);
  }
  public answerVmQuestion(id: string, answer: VmAnswer): Observable<Vm> {
    return this.http.put<Vm>(this.conf.api + '/vm/' + id + '/answer', answer);
  }
  public getVmIsos(id: string): Observable<VmOptions> {
    return this.http.get<VmOptions>(this.conf.api + '/vm/' + id + '/isos');
  }
  public getVmNets(id: string): Observable<VmOptions> {
    return this.http.get<VmOptions>(this.conf.api + '/vm/' + id + '/nets');
  }
  public getVmTicket(id: string): Observable<ConsoleSummary> {
    return this.http.get<ConsoleSummary>(this.conf.api + '/vm-console/' + id);
  }
  public getTemplateVm(id: string): Observable<Vm> {
    return this.http.get<Vm>(this.conf.api + '/vm-template/' + id);
  }
  public deployTemplate(id: string): Observable<Vm> {
    return this.http.post<Vm>(this.conf.api + '/vm-template/' + id, {});
  }
  public initializeTemplate(id: string): Observable<Vm> {
    return this.http.put<Vm>(this.conf.api + '/vm-template/' + id, {});
  }
  public reloadHost(host: string): Observable<any> {
    return this.http.post<any>(this.conf.api + '/pod/' + host, {});
  }

}
