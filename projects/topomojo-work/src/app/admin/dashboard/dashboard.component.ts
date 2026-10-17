// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { faMailBulk, faPaperPlane, faInfoCircle, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable, of } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { AdminService, HypervisorCapacity } from '../../api/admin.service';
import { CachedConnection, JanitorReport } from '../../api/gen/models';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  connections!: Observable<CachedConnection[]>;
  capacityRefresh$ = new BehaviorSubject<boolean>(true);
  capacity!: Observable<HypervisorCapacity | null>;
  importResult!: Observable<string[]>;
  janitorResult!: Observable<JanitorReport[]>;
  janitorReports: JanitorReport[] = [];
  janitorSort = { column: 'age', ascending: false };
  announcement = '';
  exportIds = '';

  faSend = faPaperPlane;
  faInfoCircle = faInfoCircle;
  faSortUp = faSortUp;
  faSortDown = faSortDown;

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

    // null means the read failed; the template says so rather than showing nothing.
    this.capacity = merge(
      this.capacityRefresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => api.getCapacity().pipe(
        catchError(() => of(null))
      ))
    );
  }

  refreshCapacity(): void {
    this.capacityRefresh$.next(true);
  }

  percent(used: number, total: number): number {
    return total > 0 ? Math.round(used * 100 / total) : 0;
  }

  // Bootstrap contextual class for a usage bar.
  level(percent: number): string {
    return percent >= 90 ? 'bg-danger' : percent >= 75 ? 'bg-warning' : 'bg-success';
  }

  gb(mb: number): string {
    return (mb / 1024).toFixed(mb >= 102400 ? 0 : 1);
  }

  providerName(provider: string): string {
    return ({ proxmox: 'Proxmox', vsphere: 'vSphere', mock: 'Mock' } as Record<string, string>)[provider] ?? provider;
  }

  asOf(value: string): string {
    return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
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
    this.janitorResult.subscribe(reports => {
      this.janitorReports = reports;
      this.sortJanitorReports();
    });
  }

  sortJanitor(column: string): void {
    if (this.janitorSort.column === column) {
      this.janitorSort.ascending = !this.janitorSort.ascending;
    } else {
      this.janitorSort.column = column;
      this.janitorSort.ascending = true;
    }
    this.sortJanitorReports();
  }

  private sortJanitorReports(): void {
    const column = this.janitorSort.column;
    const ascending = this.janitorSort.ascending;

    this.janitorReports.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'id':
          comparison = (a.id || '').localeCompare(b.id || '');
          break;
        case 'reason':
          comparison = (a.reason || '').localeCompare(b.reason || '');
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'age':
          comparison = new Date(a.age || 0).getTime() - new Date(b.age || 0).getTime();
          break;
        case 'owner':
          comparison = (a.ownerName || '').localeCompare(b.ownerName || '');
          break;
        case 'vmCount':
          comparison = (a.vmCount || 0) - (b.vmCount || 0);
          break;
      }

      return ascending ? comparison : -comparison;
    });
  }

  trackByReportId(index: number, item: JanitorReport): string {
    return item.id || index.toString();
  }
}
