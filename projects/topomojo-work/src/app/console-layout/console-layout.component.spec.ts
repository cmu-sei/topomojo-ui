// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, NEVER, of, Subject, throwError } from 'rxjs';
import { ConsoleComponent, provideConsoleForge } from '@cmusei/console-forge';
import { ConsoleLayoutComponent } from './console-layout.component';
import { ConsoleSummary, VmOperationTypeEnum } from '../consoles-api.models';
import { ConsolesApiService } from '../consoles-api.service';

type ConsoleLayoutTestAccess = {
  vmPowerState: () => string;
  consoleConfig: () => { url: string } | undefined;
  handlePowerOnRequested: () => void;
  handleConnectionStatusChanged: (status?: string) => void;
  vmActivity: () => { kind: string; status: string } | undefined;
  handleConnectFailed: (error: Error, generation?: number) => void;
};

function testAccess(component: ConsoleLayoutComponent): ConsoleLayoutTestAccess {
  return component as unknown as ConsoleLayoutTestAccess;
}

const poweredOffSummary = {
  id: 'vm-1',
  isolationId: 'iso1',
  name: 'vm1',
  url: '',
  ticket: null,
  isRunning: false
};

const poweredOnSummary = {
  id: 'vm-1',
  isolationId: 'iso1',
  name: 'vm1',
  url: 'wss://host/console',
  ticket: 't1',
  isRunning: true
};

// Proxmox grants a vncproxy ticket even when the VM is stopped, so a URL alone does not mean "on"
const stoppedProxmoxSummary = {
  id: 'vm-1',
  isolationId: 'iso1',
  name: 'vm1',
  url: 'wss://pve1/api2/json/nodes/pve1/qemu/1/vncwebsocket?port=5901&vncticket=abc',
  ticket: 'abc',
  isRunning: false
};

describe('ConsoleLayoutComponent', () => {
  let component: ConsoleLayoutComponent;
  let fixture: ComponentFixture<ConsoleLayoutComponent>;
  let api: jasmine.SpyObj<ConsolesApiService>;
  let params: BehaviorSubject<{ name: string; sessionId: string; token?: string }>;
  let connect: jasmine.Spy;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ConsolesApiService>('ConsolesApiService', ['ticket', 'nets', 'power', 'redeem']);
    api.nets.and.returnValue(of({ iso: [], net: ['shared-network'] }));
    api.power.and.returnValue(of({}));
    api.redeem.and.returnValue(of({}));
    params = new BehaviorSubject({ name: 'vm1', sessionId: 'iso1' });
    connect = spyOn(ConsoleComponent.prototype, 'connect').and.returnValue(new Promise<void>(() => {}));

    await TestBed.configureTestingModule({
      declarations: [ConsoleLayoutComponent],
      imports: [ConsoleComponent],
      providers: [
        provideConsoleForge({ disabledFeatures: { networkDisconnection: true } }),
        { provide: ActivatedRoute, useValue: { queryParams: params } },
        { provide: ConsolesApiService, useValue: api },
        { provide: Title, useValue: { setTitle: jasmine.createSpy('setTitle') } }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  function createComponent() {
    fixture = TestBed.createComponent(ConsoleLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick(0);
    fixture.detectChanges();
  }

  it('sets the power state and publishes an empty URL for a powered-off VM', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOffSummary as unknown as ConsoleSummary));
    createComponent();

    expect(testAccess(component).vmPowerState()).toBe('off');
    expect(testAccess(component).consoleConfig()!.url).toBe('');

    discardPeriodicTasks();
  }));

  it('publishes a URL once the VM reports running, and stops polling only when connected', fakeAsync(() => {
    let current: unknown = poweredOffSummary;
    api.ticket.and.callFake(() => of(current as ConsoleSummary));
    createComponent();

    expect(testAccess(component).vmPowerState()).toBe('off');

    current = poweredOnSummary;

    tick(5000);
    fixture.detectChanges();

    expect(testAccess(component).vmPowerState()).toBe('on');
    expect(testAccess(component).consoleConfig()!.url).toBe('wss://host/console');

    // running but not connected keeps polling, so a fresh ticket drives the reconnect
    const callsBeforeRetry = api.ticket.calls.count();
    tick(5000);
    fixture.detectChanges();
    expect(api.ticket.calls.count()).toBeGreaterThan(callsBeforeRetry);

    testAccess(component).handleConnectionStatusChanged('connected');
    fixture.detectChanges();

    const callsAfterConnect = api.ticket.calls.count();
    tick(5000);
    fixture.detectChanges();
    expect(api.ticket.calls.count()).toBe(callsAfterConnect);

    discardPeriodicTasks();
  }));

  it('suppresses the console URL for a stopped Proxmox VM so it does not auto-connect a dead console', fakeAsync(() => {
    api.ticket.and.returnValue(of(stoppedProxmoxSummary as unknown as ConsoleSummary));
    createComponent();

    expect(testAccess(component).consoleConfig()!.url).toBe('');

    discardPeriodicTasks();
  }));

  it('reports off for a stopped Proxmox VM that still has a console URL and ticket', fakeAsync(() => {
    api.ticket.and.returnValue(of(stoppedProxmoxSummary as unknown as ConsoleSummary));
    createComponent();

    expect(testAccess(component).vmPowerState()).toBe('off');

    discardPeriodicTasks();
  }));

  it('reports on while the console is connected, even if isRunning still trails as false', fakeAsync(() => {
    api.ticket.and.returnValue(of(stoppedProxmoxSummary as unknown as ConsoleSummary));
    createComponent();

    testAccess(component).handleConnectionStatusChanged('connected');

    expect(testAccess(component).vmPowerState()).toBe('on');

    discardPeriodicTasks();
  }));

  it('powers on the VM when requested', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOffSummary as unknown as ConsoleSummary));
    createComponent();

    testAccess(component).handlePowerOnRequested();

    expect(api.power).toHaveBeenCalledOnceWith({ id: 'vm-1', type: VmOperationTypeEnum.start });

    discardPeriodicTasks();
  }));

  it('uses the ID from the latest summary when powering on', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    api.ticket.and.returnValue(of({ ...poweredOffSummary, id: 'replacement-vm' } as ConsoleSummary));
    tick(5000);
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledOnceWith({ id: 'replacement-vm', type: VmOperationTypeEnum.start });
    discardPeriodicTasks();
  }));

  it('renders real Forge migration feedback and suppresses Power On and connection', fakeAsync(() => {
    api.ticket.and.returnValue(of({
      ...stoppedProxmoxSummary, state: 'off', activity: { kind: 'migrating', status: 'active' }
    } as ConsoleSummary));
    createComponent();
    const status = fixture.nativeElement.querySelector('cf-console-status').shadowRoot as ShadowRoot;
    expect(status.textContent).toContain('Migrating VM');
    expect(status.querySelector('button')).toBeNull();
    expect(connect).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('blocks duplicate starts and permits retry after a failed request and a fresh off read', fakeAsync(() => {
    const start = new Subject<unknown>();
    api.power.and.returnValue(start);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    testAccess(component).handlePowerOnRequested();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(1);
    start.error({ status: 500 });
    fixture.detectChanges();
    expect(testAccess(component).vmPowerState()).toBe('unknown');
    tick(5000);
    fixture.detectChanges();
    expect(testAccess(component).vmPowerState()).toBe('off');
    expect(testAccess(component).vmActivity()).toBeUndefined();
    discardPeriodicTasks();
  }));

  it('waits for token redemption before polling and redeems only once on reconnect', fakeAsync(() => {
    const redemption = new Subject<unknown>();
    params.next({ name: 'vm1', sessionId: 'iso1', token: 'handoff' });
    api.redeem.and.returnValue(redemption);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    tick(10000);
    expect(api.ticket).not.toHaveBeenCalled();
    redemption.next({});
    redemption.complete();
    tick(0);
    fixture.detectChanges();
    expect(api.ticket).toHaveBeenCalledTimes(1);
    // Exercise the actual Angular output.
    const consoleElement = fixture.debugElement.children.find(child => child.componentInstance instanceof ConsoleComponent);
    consoleElement?.componentInstance.reconnectRequest.emit({});
    tick(0);
    expect(api.redeem).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('cancels stale route requests and clears the previous VM before loading the next', fakeAsync(() => {
    const first = new Subject<ConsoleSummary>();
    const second = new Subject<ConsoleSummary>();
    api.ticket.and.returnValues(first, second);
    createComponent();
    params.next({ name: 'vm2', sessionId: 'iso2' });
    tick(0);
    expect(testAccess(component).consoleConfig()).toBeUndefined();
    first.next(poweredOffSummary as ConsoleSummary);
    expect(testAccess(component).consoleConfig()).toBeUndefined();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).not.toHaveBeenCalled();
    first.complete();
    second.next({ ...poweredOffSummary, id: 'vm2' } as ConsoleSummary);
    second.complete();
    fixture.detectChanges();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledOnceWith({ id: 'vm2', type: VmOperationTypeEnum.start });
    fixture.destroy();
    const calls = api.ticket.calls.count();
    tick(10000);
    expect(api.ticket.calls.count()).toBe(calls);
  }));

  it('does not cancel a slow ticket request every five seconds', fakeAsync(() => {
    api.ticket.and.returnValue(NEVER);
    createComponent();
    tick(10000);
    expect(api.ticket).toHaveBeenCalledTimes(1);
    fixture.destroy();
  }));

  for (const status of [401, 403]) {
    it(`stops automatic polling on ${status} without showing off`, fakeAsync(() => {
      api.ticket.and.returnValue(throwError(() => ({ status })));
      createComponent();
      tick(15000);
      expect(api.ticket).toHaveBeenCalledTimes(1);
      expect(testAccess(component).vmPowerState()).toBe('unknown');
      expect(api.power).not.toHaveBeenCalled();
      discardPeriodicTasks();
    }));
  }

  it('allows a slow handshake to finish and retries unchanged tickets after failure', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOnSummary as ConsoleSummary));
    createComponent();
    tick(10000);
    fixture.detectChanges();
    expect(connect).toHaveBeenCalledTimes(1);
    testAccess(component).handleConnectFailed(new Error('Connection refused'));
    tick(5000);
    fixture.detectChanges();
    expect(connect).toHaveBeenCalledTimes(2);
    fixture.destroy();
  }));

  it('times out a handshake and retries on the next poll', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOnSummary as ConsoleSummary));
    createComponent();
    tick(30000);
    fixture.detectChanges();
    tick(5000);
    fixture.detectChanges();
    expect(connect.calls.count()).toBeGreaterThan(1);
    fixture.destroy();
  }));

  it('distinguishes unavailable and suspended state from off', fakeAsync(() => {
    api.ticket.and.returnValue(of({ ...poweredOffSummary, state: null } as ConsoleSummary));
    createComponent();
    expect(testAccess(component).vmPowerState()).toBe('unknown');
    api.ticket.and.returnValue(of({ ...poweredOffSummary, state: 'suspended' } as ConsoleSummary));
    tick(5000);
    fixture.detectChanges();
    expect(testAccess(component).vmPowerState()).toBe('suspended');
    const status = fixture.nativeElement.querySelector('cf-console-status').shadowRoot as ShadowRoot;
    expect(status.textContent).toContain('VM suspended');
    expect(status.querySelector('button')).toBeNull();
    discardPeriodicTasks();
  }));
});
