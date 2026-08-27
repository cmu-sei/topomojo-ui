// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ConsoleLayoutComponent } from './console-layout.component';
import { ConsoleSummary, VmOperationTypeEnum } from '../consoles-api.models';
import { ConsolesApiService } from '../consoles-api.service';

type ConsoleLayoutTestAccess = {
  vmPowerState: () => string;
  consoleConfig: () => { url: string } | undefined;
  handlePowerOnRequested: () => void;
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

describe('ConsoleLayoutComponent', () => {
  let component: ConsoleLayoutComponent;
  let fixture: ComponentFixture<ConsoleLayoutComponent>;
  let api: jasmine.SpyObj<ConsolesApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ConsolesApiService>('ConsolesApiService', ['ticket', 'nets', 'power', 'redeem']);
    api.nets.and.returnValue(of({ iso: [], net: [] }));
    api.power.and.returnValue(of({}));
    api.redeem.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [ConsoleLayoutComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({ name: 'vm1', sessionId: 'iso1' }) } },
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
  }

  it('sets the power state and publishes an empty URL for a powered-off VM', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOffSummary as unknown as ConsoleSummary));
    createComponent();

    expect(testAccess(component).vmPowerState()).toBe('off');
    expect(testAccess(component).consoleConfig()!.url).toBe('');

    discardPeriodicTasks();
  }));

  it('polls until a console URL is available, then stops polling', fakeAsync(() => {
    api.ticket.and.returnValues(
      of(poweredOffSummary as unknown as ConsoleSummary),
      of(poweredOnSummary as unknown as ConsoleSummary)
    );
    createComponent();

    tick(5000);
    fixture.detectChanges();

    expect(testAccess(component).vmPowerState()).toBe('on');
    expect(testAccess(component).consoleConfig()!.url).toBe('wss://host/console');

    const callsAfterConnect = api.ticket.calls.count();
    tick(5000);
    fixture.detectChanges();
    expect(api.ticket.calls.count()).toBe(callsAfterConnect);

    discardPeriodicTasks();
  }));

  it('powers on the VM when requested', fakeAsync(() => {
    api.ticket.and.returnValue(of(poweredOffSummary as unknown as ConsoleSummary));
    createComponent();

    testAccess(component).handlePowerOnRequested();

    expect(api.power).toHaveBeenCalledOnceWith({ id: 'vm-1', type: VmOperationTypeEnum.start });

    discardPeriodicTasks();
  }));
});
