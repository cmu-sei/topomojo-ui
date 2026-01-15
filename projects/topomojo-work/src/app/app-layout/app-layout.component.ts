import { Component, HostListener, ViewChild, ElementRef } from '@angular/core';
import { ConfigService } from '../config.service';
import { UserService } from '../user.service';
import { HubState, NotificationService } from '../notification.service';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';
import { debounceTime, Observable } from 'rxjs';
import { ApiUser } from '../api/gen/models';
import { faChevronLeft, faChevronRight, faExclamationTriangle, faBars, faThumbtack, faTimes } from '@fortawesome/free-solid-svg-icons';

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
  faBars = faBars;
  faExclamationTriangle = faExclamationTriangle;
  faClose = faTimes;

  @ViewChild('sidebarContainer') sidebarRef!: ElementRef<HTMLElement>;

  disableExternalLinks = false;

  constructor(
    config: ConfigService,
    userSvc: UserService,
    hubSvc: NotificationService,
    private router: Router,
    private auth: AuthService
  ) {
    this.appname = config.settings.appname;
    this.websocket = hubSvc.state$.pipe(debounceTime(500));

    this.disableExternalLinks = !!(config.settings as any).disableExternalLinks;
    this.loadSidebarState();

    config.sidebar$.subscribe(state => {
      this.open = state;
      this.saveSidebarState();
    });

    userSvc.user$.pipe(
    ).subscribe(u => this.user = u);
  }

  logout(): void {
    this.auth.logout();
  }

  keyclick(ev: KeyboardEvent): boolean {
    if (ev.code === 'Enter' || ev.code === 'Space') {
      this.pinned = !this.pinned;
      this.open = !this.open;
      this.saveSidebarState();
      return false;
    }
    return true;
  }

  pin(): void {
    this.pinned = !this.pinned;
    this.saveSidebarState();
  }

  toggleSidebar(): void {
    this.open = !this.open;
    this.saveSidebarState();
  }

  closeSidebar(): void {
    this.open = false;
    this.pinned = false;
    this.saveSidebarState();
  }

  private readonly SIDEBAR_OPEN_KEY = 'topomojo.sidebar.open';
  private readonly SIDEBAR_PINNED_KEY = 'topomojo.sidebar.pinned';

  private loadSidebarState(): void {
    const openSaved = localStorage.getItem(this.SIDEBAR_OPEN_KEY);
    if (openSaved !== null) {
      this.open = openSaved === 'true';
    }

    const pinnedSaved = localStorage.getItem(this.SIDEBAR_PINNED_KEY);
    if (pinnedSaved !== null) {
      this.pinned = pinnedSaved === 'true';
    }
  }

  private saveSidebarState(): void {
    localStorage.setItem(this.SIDEBAR_OPEN_KEY, String(this.open));
    localStorage.setItem(this.SIDEBAR_PINNED_KEY, String(this.pinned));
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): boolean {
    if (ev.ctrlKey) {
      switch (ev.code) {
        case 'KeyO':
          this.open = true;
          this.saveSidebarState();
          break;

        case 'KeyH':
          this.router.navigate(['/']);
          break;

        case 'KeyL':
          this.open = !this.open;
          this.saveSidebarState();
          break;
      }
    }

    return true;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open || this.pinned) {
      return;
    }

    if (!this.sidebarRef?.nativeElement) {
      return;
    }

    const sidebarEl = this.sidebarRef.nativeElement;

    if (sidebarEl.contains(event.target as Node)) {
      return;
    }

    this.closeSidebar();
  }
}
