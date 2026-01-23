// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take, switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

type UiSettings = {
  appname?: string;
  apphost?: string;
  docsUrl?: string;
  disableExternalLinks?: boolean;
};

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: false
})
export class AboutComponent implements OnInit {
  uiVersion = environment.VERSION;
  apiVersion = '—';
  versionError = '';

  disableExternalLinks = false;

  private readonly defaultLinks = {
    repo: 'https://github.com/cmu-sei/TopoMojo',
    docs: 'https://cmu-sei.github.io/crucible/topomojo',
    license: 'https://github.com/cmu-sei/TopoMojo/blob/master/LICENSE.md',
  };

  links = { ...this.defaultLinks };

  constructor(private http: HttpClient) {}

  get showResources(): boolean {
    if (this.disableExternalLinks) return !!this.links.docs;
    return !!this.links.repo || !!this.links.docs || !!this.links.license;
  }

  ngOnInit(): void {
    this.http.get<UiSettings>('assets/settings.json').pipe(
      take(1),

      tap((s) => {
        this.disableExternalLinks = !!s.disableExternalLinks;

        const docs = (s.docsUrl ?? '').trim();
        if (this.disableExternalLinks) {
          this.links = { repo: '', license: '', docs: docs || '' };
        } else {
          this.links = { ...this.defaultLinks, docs: docs || this.defaultLinks.docs };
        }
      }),

      switchMap((s) => {
        const base = (s.apphost ?? '').replace(/\/+$/, '');
        const url = base ? `${base}/api/health/version` : `/api/health/version`;
        return this.http.get(url, { responseType: 'text' }).pipe(take(1));
      }),

      catchError(() => {
        this.apiVersion = 'API ERROR!';
        this.versionError = 'Unable to load API version.';
        return of('');
      })
    )
    .subscribe((v) => {
      if (!v) return;
      this.apiVersion = (v || '').split('+')[0] || 'unknown';
    });
  }
}
