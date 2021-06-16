import { Component, OnInit } from '@angular/core';
import { faMailBulk, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { AdminService } from '../../api/admin.service';
import { CachedConnection, JanitorReport } from '../../api/gen/models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  connections!: Observable<CachedConnection[]>;
  importResult!: Observable<string[]>;
  janitorResult!: Observable<JanitorReport[]>;
  announcement = '';
  exportIds = '';

  faSend = faPaperPlane;

  constructor(
    private api: AdminService
  ){
    this.connections = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => api.listConnections())
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.refresh$.next(true);
  }

  announce(): void {
    this.api.createAnnouncement(this.announcement).subscribe(
      () => {
        this.announcement = '';
      }
    );
  }

  import(): void {
    this.importResult = this.api.import();
  }

  export(): void {
    const ids = this.exportIds.split(/[,\ ]/).map(v => +v);
    this.api.export(
      ids
    ).subscribe(() => this.exportIds = '');
  }

  trackById(i: number, item: CachedConnection): string {
    return item.id;
  }

  cleanup(): void {
    this.janitorResult = this.api.cleanup();
  }
}
