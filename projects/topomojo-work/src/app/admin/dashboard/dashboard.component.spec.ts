// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AdminService, HypervisorCapacity } from '../../api/admin.service';
import { DashboardComponent } from './dashboard.component';

const capacity = (patch: Partial<HypervisorCapacity> = {}): HypervisorCapacity => ({
  provider: 'proxmox',
  asOf: '2026-11-11T12:00:00Z',
  nodes: [
    { name: 'pve1', available: true, memoryTotalMb: 1000, memoryUsedMb: 950, cpuCores: 8, cpuUsagePercent: 10 },
    { name: 'pve2', available: true, memoryTotalMb: 1000, memoryUsedMb: 820, cpuCores: 8, cpuUsagePercent: 10 },
    { name: 'pve3', available: true, memoryTotalMb: 1000, memoryUsedMb: 100, cpuCores: 8, cpuUsagePercent: 10 }
  ],
  storage: [
    { name: 'local-lvm', node: 'pve2', shared: false, available: true, totalMb: 1000, usedMb: 800 }
  ],
  warnPercent: 75,
  criticalPercent: 90,
  alerts: [
    { name: 'pve1', resource: 'memory', percent: 95, level: 'critical' },
    { name: 'pve2', resource: 'memory', percent: 82, level: 'warning' },
    { name: 'local-lvm', node: 'pve2', resource: 'storage', percent: 80, level: 'warning' }
  ],
  ...patch
});

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let api: jasmine.SpyObj<AdminService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AdminService>('AdminService', ['getCapacity', 'listConnections']);
    api.listConnections.and.returnValue(of([]));
    api.getCapacity.and.returnValue(of(capacity()));

    await TestBed.configureTestingModule({
      declarations: [ DashboardComponent ],
      imports: [ FormsModule ],
      providers: [ { provide: AdminService, useValue: api } ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  });

  // the capacity read is debounced 500ms and repeats every minute
  function render(): HTMLElement {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should create', fakeAsync(() => {
    render();
    expect(component).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('lists each host and store over the warning level, critical first', fakeAsync(() => {
    const el = render();
    const banner = el.querySelector('.alert') as HTMLElement;

    expect(banner).toBeTruthy();
    expect(banner.classList).toContain('alert-danger');
    expect(banner.textContent).toContain('at or over 75% used (90% is critical)');

    const items = Array.from(banner.querySelectorAll('li')).map(li => li.textContent!.replace(/\s+/g, ' ').trim());
    expect(items).toEqual([
      'Critical Memory on pve1: 95% used',
      'Warning Memory on pve2: 82% used',
      'Warning Storage local-lvm on pve2: 80% used'
    ]);
    discardPeriodicTasks();
  }));

  it('is a warning banner when nothing is critical', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(capacity({
      alerts: [{ name: 'pve2', resource: 'memory', percent: 82, level: 'warning' }]
    })));

    const banner = render().querySelector('.alert') as HTMLElement;

    expect(banner.classList).toContain('alert-warning');
    expect(banner.textContent).toContain('Hypervisor is filling up.');
    discardPeriodicTasks();
  }));

  it('shows no banner when nothing is over the warning level', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(capacity({ alerts: [] })));

    expect(render().querySelector('.alert')).toBeNull();
    discardPeriodicTasks();
  }));

  it('shows no banner when the hypervisor cannot be read', fakeAsync(() => {
    api.getCapacity.and.returnValue(throwError(() => new Error('down')));

    const el = render();

    expect(el.querySelector('.alert')).toBeNull();
    expect(el.textContent).toContain('Hypervisor figures are unavailable.');
    discardPeriodicTasks();
  }));

  it('reads capacity once for the banner and the tables', fakeAsync(() => {
    render();

    expect(api.getCapacity).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('colors bars with the levels the API sends', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(capacity({ warnPercent: 50, criticalPercent: 80, alerts: [] })));

    const el = render();
    const bars = Array.from(el.querySelectorAll('table.capacity:not(.storage) tbody tr'))
      .map(tr => tr.querySelector('td:nth-child(2) .progress-bar')!.className);

    // pve1 95% critical, pve2 82% critical at 80, pve3 10% fine
    expect(bars[0]).toContain('bg-danger');
    expect(bars[1]).toContain('bg-danger');
    expect(bars[2]).toContain('bg-success');
    expect(component.level(60)).toBe('bg-warning');
    discardPeriodicTasks();
  }));

  it('falls back to 75 and 90 when the API sends no levels', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(capacity({ warnPercent: undefined, criticalPercent: undefined, alerts: undefined })));

    render();

    expect(component.level(74)).toBe('bg-success');
    expect(component.level(75)).toBe('bg-warning');
    expect(component.level(90)).toBe('bg-danger');
    discardPeriodicTasks();
  }));
});
