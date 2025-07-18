import { Component, HostListener } from '@angular/core';
import { ConfigService } from '../config.service';
import { UserService } from '../user.service';
import { HubState, NotificationService } from '../notification.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { debounceTime, Observable } from 'rxjs';
import { ApiUser } from '../api/gen/models';
import { faChevronLeft, faChevronRight, faExclamationTriangle, faSearch, faThumbtack } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-app-layout',
  standalone: false,
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss'
})
export class AppLayoutComponent {
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

    config.sidebar$.subscribe(
      state => this.open = state
    );

    userSvc.user$.pipe(
    ).subscribe(u => this.user = u);
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
