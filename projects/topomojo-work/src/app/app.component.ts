import { Component, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiSettings } from './api/api-settings';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from './config.service';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from './theme.service';

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
    private config: ConfigService,
    private route: ActivatedRoute,
    private themeSvc: ThemeService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const brandColor = this.config.settings.brandColor;
    // An invalid value would blank every brand-colored rule, so keep the built-in default instead.
    if (brandColor && CSS.supports('color', brandColor)) {
      this.document.documentElement.style.setProperty('--brand-color', brandColor);
    }

    // ?theme=dark-theme|light-theme, as in the other Crucible apps; saved like the toggle.
    this.route.queryParamMap.subscribe(params => {
      const theme = params.get('theme');
      if (theme) {
        this.themeSvc.setTheme(theme);
      }
    });

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
