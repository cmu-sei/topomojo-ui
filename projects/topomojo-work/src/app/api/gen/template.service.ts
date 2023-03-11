// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { ChangedTemplate, ChangedTemplateDetail, Search, Template, TemplateClone, TemplateDetail, TemplateLink, TemplateReLink, TemplateSearch, TemplateSummary } from './models';

@Injectable()
export class GeneratedTemplateService extends GeneratedService {

  constructor(
    protected http: HttpClient,
    protected conf: ApiSettings
  ) { super(http, conf); }

  public list(search: TemplateSearch): Observable<TemplateSummary[]> {
    return this.http.get<TemplateSummary[]>(this.conf.api + '/templates' + this.paramify(search));
  }
  public listSiblings(id: string, pub: boolean): Observable<TemplateSummary[]> {
    return this.http.get<TemplateSummary[]>(this.conf.api + `/template/${id}/siblings` + this.paramify({pub}));
  }
  public load(id: string): Observable<Template> {
    return this.http.get<Template>(this.conf.api + '/template/' + id);
  }
  public delete(id: string): Observable<any> {
    return this.http.delete<any>(this.conf.api + '/template/' + id);
  }
  public update(template: ChangedTemplate): Observable<any> {
    return this.http.put<any>(this.conf.api + '/template', template);
  }
  public link(link: TemplateLink): Observable<Template> {
    return this.http.post<Template>(this.conf.api + '/template', link);
  }
  public unlink(link: TemplateLink): Observable<Template> {
    return this.http.post<Template>(this.conf.api + '/template/unlink', link);
  }
  public relink(model: TemplateReLink): Observable<Template> {
    return this.http.post<Template>(this.conf.api + '/template/relink', model);
  }
  public loadDetail(id: string): Observable<TemplateDetail> {
    return this.http.get<TemplateDetail>(this.conf.api + '/template-detail/' + id);
  }
  public createDetail(model: TemplateDetail): Observable<TemplateDetail> {
    return this.http.post<TemplateDetail>(this.conf.api + '/template-detail', model);
  }
  public updateDetail(template: ChangedTemplateDetail): Observable<any> {
    return this.http.put<any>(this.conf.api + '/template-detail', template);
  }
  public clone(model: TemplateClone): Observable<Template> {
    return this.http.post<Template>(this.conf.api + '/template/clone', model);
  }
}
