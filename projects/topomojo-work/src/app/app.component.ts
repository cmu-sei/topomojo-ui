// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, HostListener } from '@angular/core';
import { debounceTime, filter, tap } from 'rxjs/operators';
import { ApiUser } from './api/gen/models';
import { ConfigService } from './config.service';
import { UserService } from './user.service';
import { AuthService, AuthTokenState } from './auth.service';
import { Router } from '@angular/router';
import { HubState, NotificationService } from './notification.service';
import { Observable } from 'rxjs';
import { faChevronRight, faChevronLeft, faThumbtack, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'topomojo-work';
  appname: string | undefined;
  open = true;
  pinned = false;
  user: ApiUser | null = null;
  websocket: Observable<HubState>;

  faOpen = faChevronLeft;
  faClosed = faChevronRight;
  faThumbtack = faThumbtack;
  faSearch = faSearch;
  faExclamationTriangle = faExclamationTriangle;

  constructor(
    config: ConfigService,
    userSvc: UserService,
    hubSvc: NotificationService,
    private router: Router,
    private auth: AuthService
  ) {
    this.appname = config.settings.appname;
    this.websocket = hubSvc.state$.pipe(debounceTime(500));

    userSvc.user$.pipe(
      // tap(u => console.log('app user ' + u?.id))
      // tap(u => console.log(u))
    ).subscribe(u => this.user = u);

    auth.tokenState$.pipe(
      filter(t => t === AuthTokenState.expired)
    ).subscribe(t => router.navigate(['/']));
  }

  logout(): void {
    this.auth.logout();
  }

  pin(): void {
    this.pinned = !this.pinned;
  }

  keyclick(ev: KeyboardEvent): boolean {
    if (ev.code === 'Enter' || ev.code === 'Space') {
      this.pinned = !this.pinned;
      this.open = !this.open;
      return false;
    }
    return true;
  }

  mouseenter(ev: MouseEvent): boolean {
    if (!this.open) {
      this.open = true;
    }
    return false;
  }

  mouseleave(ev: MouseEvent): boolean {
    if (!this.pinned) {
      this.open = false;
    }
    return false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    if (ev.ctrlKey) {
      switch (ev.code) {
        case 'KeyO':
          this.open = true;
          break;

        case 'KeyH':
          this.router.navigate(['/']);
          break;

        case 'KeyL':
          this.open = !this.open;
          break;
      }
    }

    return true;
  }
}
