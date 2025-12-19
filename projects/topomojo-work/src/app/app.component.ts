import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiSettings } from './api/api-settings';
import { HttpClient } from '@angular/common/http';

type ThemeInfo = { backgroundUrl: string | null };

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  title = 'topomojo-work';

  constructor(
    private http: HttpClient,
    private conf: ApiSettings,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.http.get<ThemeInfo>(this.conf.api + '/theme').subscribe({
      next: (r) => {
        const root = this.document.documentElement;
        const hasBg = !!r.backgroundUrl;

        root.style.setProperty(
          '--app-bg-image',
          hasBg ? `url("${r.backgroundUrl}")` : 'none'
        );

        root.classList.toggle('has-bg-image', hasBg);
      },
      error: () => {
        const root = this.document.documentElement;
        root.style.setProperty('--app-bg-image', 'none');
        root.classList.remove('has-bg-image');
      },
    });
  }

}
