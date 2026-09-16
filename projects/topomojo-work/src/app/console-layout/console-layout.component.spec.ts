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
  handleReconnectRequest: () => Promise<void>;
  handleConnectionStatusChanged: (status?: string) => void;
  vmActivity: () => { kind: string; status: string } | undefined;
  errors: any[];
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

const failedStartSummary = {
  ...poweredOffSummary,
  activity: { kind: 'starting', status: 'failed', message: 'Previous start failed.' }
} as ConsoleSummary;

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

  it('publishes a URL once the VM reports running, and stops polling only when connected', fakeAsync(() => {
    let current: unknown = stoppedProxmoxSummary;
    api.ticket.and.callFake(() => of(current as ConsoleSummary));
    createComponent();

    expect(testAccess(component).vmPowerState()).toBe('off');
    expect(testAccess(component).consoleConfig()!.url).toBe('');
    expect(connect).not.toHaveBeenCalled();

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

  it('renders real Forge migration feedback and suppresses Power On and connection', fakeAsync(() => {
    api.ticket.and.returnValue(of({
      ...stoppedProxmoxSummary, state: 'off', activity: { kind: 'migrating', status: 'active' }
    } as ConsoleSummary));
    createComponent();
    const status = fixture.nativeElement.querySelector('cf-console-status').shadowRoot as ShadowRoot;
    expect(status.textContent).toContain('Migrating VM');
    expect(status.querySelector('button')).toBeNull();
    expect(status.querySelector('progress')?.getAttribute('aria-label')).toContain('Migrating VM');
    expect(connect).not.toHaveBeenCalled();
    testAccess(component).handleConnectionStatusChanged('connected');
    expect(testAccess(component).vmPowerState()).toBe('on');
    discardPeriodicTasks();
  }));

  it('blocks duplicate starts and permits retry after a failed request and a fresh off read', fakeAsync(() => {
    const start = new Subject<unknown>();
    api.power.and.returnValue(start);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    testAccess(component).handlePowerOnRequested();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledOnceWith({ id: 'vm-1', type: VmOperationTypeEnum.start });
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
    const initialConsole = consoleElement?.componentInstance;
    consoleElement?.componentInstance.reconnectRequest.emit({});
    tick(0);
    fixture.detectChanges();
    expect(api.redeem).toHaveBeenCalledTimes(1);
    expect(fixture.debugElement.children.find(child => child.componentInstance instanceof ConsoleComponent)?.componentInstance)
      .toBe(initialConsole);
    discardPeriodicTasks();
  }));

  it('preserves an outstanding Power On and its original deadline across reconnects', fakeAsync(() => {
    const start = new Subject<unknown>();
    api.power.and.returnValue(start);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    testAccess(component).handlePowerOnRequested();
    tick(10000);
    void testAccess(component).handleReconnectRequest();
    tick(0);
    expect(start.observed).toBeTrue();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(1);
    start.next({});
    start.complete();
    tick(109999);
    expect(testAccess(component).vmActivity()?.kind).toBe('starting');
    tick(1);
    expect(testAccess(component).vmActivity()).toBeUndefined();
    expect(testAccess(component).errors[0].message).toContain('not been confirmed');
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(2);
    fixture.destroy();
  }));

  for (const outcome of ['active', 'unknown']) {
    it(`keeps Power On blocked after the deadline when state is ${outcome}`, fakeAsync(() => {
      api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
      createComponent();
      testAccess(component).handlePowerOnRequested();
      api.ticket.and.returnValue(of({
        ...poweredOffSummary,
        ...(outcome === 'active'
          ? { activity: { kind: 'starting', status: 'active' } }
          : { state: null })
      } as ConsoleSummary));
      tick(120000);
      testAccess(component).handlePowerOnRequested();
      expect(api.power).toHaveBeenCalledTimes(1);
      if (outcome === 'active')
        expect(testAccess(component).vmActivity()).toEqual({ kind: 'starting', status: 'active' });
      else
        expect(testAccess(component).vmPowerState()).toBe('unknown');
      fixture.destroy();
    }));
  }

  it('shows starting feedback and rejects repeated old failures while retrying', fakeAsync(() => {
    const start = new Subject<unknown>();
    api.power.and.returnValue(start);
    api.ticket.and.returnValue(of(failedStartSummary));
    createComponent();
    testAccess(component).handlePowerOnRequested();
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('cf-console-status').shadowRoot as ShadowRoot;
    expect(status.textContent).toContain('Starting VM');
    expect(status.querySelector('button')).toBeNull();
    tick(5000);
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(1);
    start.next({});
    start.complete();
    tick(5000);
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(1);
    expect(testAccess(component).vmActivity()?.status).toBe('active');
    fixture.destroy();
  }));

  it('does not let a delayed poll begun before the PUT completed settle the start', fakeAsync(() => {
    const start = new Subject<unknown>();
    const stalePoll = new Subject<ConsoleSummary>();
    api.power.and.returnValue(start);
    api.ticket.and.returnValues(of(poweredOffSummary as ConsoleSummary), stalePoll);
    createComponent();
    testAccess(component).handlePowerOnRequested();
    tick(5000);
    start.next({});
    start.complete();
    stalePoll.next(failedStartSummary);
    stalePoll.complete();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(1);
    expect(testAccess(component).vmActivity()?.status).toBe('active');
    api.ticket.and.returnValue(of(failedStartSummary));
    tick(5000);
    expect(testAccess(component).vmActivity()?.status).toBe('failed');
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(2);
    fixture.destroy();
  }));

  for (const transition of ['different failure', 'non-failed observation']) {
    it(`accepts a new failure after a ${transition}`, fakeAsync(() => {
      api.ticket.and.returnValue(of(failedStartSummary));
      createComponent();
      testAccess(component).handlePowerOnRequested();
      if (transition === 'non-failed observation') {
        api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
        tick(5000);
        api.ticket.and.returnValue(of(failedStartSummary));
      } else {
        api.ticket.and.returnValue(of({
          ...failedStartSummary,
          activity: { kind: 'starting', status: 'failed', message: 'New start failed.' }
        } as ConsoleSummary));
      }
      tick(5000);
      expect(testAccess(component).vmActivity()?.status).toBe('failed');
      testAccess(component).handlePowerOnRequested();
      expect(api.power).toHaveBeenCalledTimes(2);
      fixture.destroy();
    }));
  }

  it('keeps the request guard after running feedback clears local pending', fakeAsync(() => {
    const start = new Subject<unknown>();
    api.power.and.returnValue(start);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    testAccess(component).handlePowerOnRequested();
    api.ticket.and.returnValue(of(poweredOnSummary as ConsoleSummary));
    tick(5000);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    tick(5000);
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(1);
    start.next({});
    start.complete();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(2);
    fixture.destroy();
  }));

  for (const outcome of ['success', 'error']) {
    it(`lets the old route request finish with ${outcome} without affecting a later attempt`, fakeAsync(() => {
      const firstStart = new Subject<unknown>();
      const secondStart = new Subject<unknown>();
      api.power.and.returnValues(firstStart, secondStart);
      api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
      createComponent();
      testAccess(component).handlePowerOnRequested();
      tick(10000);
      params.next({ name: 'vm2', sessionId: 'iso2' });
      tick(0);
      expect(firstStart.observed).toBeTrue();
      testAccess(component).handlePowerOnRequested();
      if (outcome === 'success') {
        firstStart.next({});
        firstStart.complete();
      } else {
        firstStart.error({ status: 500 });
      }
      expect(firstStart.observed).toBeFalse();
      expect(testAccess(component).errors).toEqual([]);
      secondStart.next({});
      secondStart.complete();
      tick(110000);
      expect(testAccess(component).vmActivity()?.kind).toBe('starting');
      expect(testAccess(component).errors).toEqual([]);
      tick(10000);
      expect(testAccess(component).vmActivity()).toBeUndefined();
      fixture.destroy();
    }));
  }

  for (const outcome of ['success', 'error', 'timeout']) {
    it(`lets Power On finish with ${outcome} after destruction without updating UI state`, fakeAsync(() => {
      const start = new Subject<unknown>();
      api.power.and.returnValue(start);
      api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
      createComponent();
      testAccess(component).handlePowerOnRequested();
      fixture.destroy();
      expect(start.observed).toBeTrue();
      if (outcome === 'success') {
        start.next({});
        start.complete();
      } else if (outcome === 'error') {
        start.error({ status: 500 });
      } else {
        tick(29999);
        expect(start.observed).toBeTrue();
        tick(1);
      }
      expect(start.observed).toBeFalse();
      tick(120000);
      expect(testAccess(component).errors).toEqual([]);
      expect(testAccess(component).vmActivity()).toBeUndefined();
    }));
  }

  it('retains the HTTP timeout and permits retry after a fresh off observation', fakeAsync(() => {
    api.power.and.returnValue(NEVER);
    api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
    createComponent();
    testAccess(component).handlePowerOnRequested();
    tick(35000);
    expect(testAccess(component).vmActivity()).toBeUndefined();
    testAccess(component).handlePowerOnRequested();
    expect(api.power).toHaveBeenCalledTimes(2);
    fixture.destroy();
    tick(30000);
  }));

  for (const missing of ['name', 'sessionId'] as const) {
    it(`does not show loading for a missing ${missing}, even after error dismissal`, fakeAsync(() => {
      params.next({ name: 'vm1', sessionId: 'iso1', [missing]: '' });
      api.ticket.and.returnValue(of(poweredOffSummary as ConsoleSummary));
      createComponent();
      expect(testAccess(component).errors[0].message).toContain('VM name and session ID');
      expect(fixture.nativeElement.querySelector('app-spinner')).toBeNull();
      expect(api.ticket).not.toHaveBeenCalled();
      testAccess(component).errors.splice(0);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-spinner')).toBeNull();
      const ticket = new Subject<ConsoleSummary>();
      api.ticket.and.returnValue(ticket);
      params.next({ name: 'vm1', sessionId: 'iso1' });
      tick(0);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-spinner')).not.toBeNull();
      ticket.next(poweredOffSummary as ConsoleSummary);
      ticket.complete();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('cf-console')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('app-spinner')).toBeNull();
      fixture.destroy();
    }));
  }

  it('keeps the console mounted while a reconnect refresh waits for a ticket', fakeAsync(() => {
    const initialTicket = new Subject<ConsoleSummary>();
    const refreshedTicket = new Subject<ConsoleSummary>();
    api.ticket.and.returnValues(initialTicket, refreshedTicket);
    createComponent();

    initialTicket.next(poweredOnSummary as ConsoleSummary);
    fixture.detectChanges();
    const initialConsole = fixture.debugElement.children.find(child => child.componentInstance instanceof ConsoleComponent)
      ?.componentInstance;
    expect(initialConsole).toBeTruthy();

    initialConsole?.reconnectRequest.emit({});
    tick(0);
    fixture.detectChanges();

    expect(api.ticket).toHaveBeenCalledTimes(2);
    expect(fixture.debugElement.children.find(child => child.componentInstance instanceof ConsoleComponent)?.componentInstance)
      .toBe(initialConsole);
    expect(fixture.nativeElement.querySelector('app-spinner')).toBeNull();

    refreshedTicket.next(poweredOnSummary as ConsoleSummary);
    fixture.destroy();
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

  it('times out a handshake and retries on the next poll', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOnSummary as ConsoleSummary));
    createComponent();
    tick(10000);
    expect(connect).toHaveBeenCalledTimes(1);
    tick(20000);
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
