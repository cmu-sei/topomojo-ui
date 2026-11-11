// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AlertModule } from 'ngx-bootstrap/alert';
import { VmControllerComponent } from './vm-controller.component';
import { Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';
import { ConfigService } from '../../config.service';
import { NotificationService } from '../../notification.service';
import { of, Subject } from 'rxjs';

describe('VmControllerComponent', () => {
  let component: VmControllerComponent;
  let config: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    config = jasmine.createSpyObj<ConfigService>('ConfigService', ['openConsole']);
    component = new VmControllerComponent(
      {} as VmService,
      config,
      { vmEvents: new Subject() } as unknown as NotificationService
    );
  });

  afterEach(() => component.ngOnDestroy());

  it('refreshes missing identity without opening a malformed URL, then opens when identity arrives', () => {
    const refresh = spyOn(component, 'do');
    component.vm = { id: '123', name: '' };
    component.console();
    expect(config.openConsole).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledOnceWith('refresh');
    expect(component.errors[0].message).toContain('identity is still loading');
    component.taskResolve({ id: '123', name: 'Ubuntu#workspace-id' });
    component.console();
    expect(config.openConsole).toHaveBeenCalledOnceWith({ name: 'Ubuntu', sessionId: 'workspace-id' });
    expect(component.errors).toEqual([]);
  });
});

describe('VmControllerComponent deploy', () => {
  let fixture: ComponentFixture<VmControllerComponent>;
  let api: jasmine.SpyObj<VmService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<VmService>('VmService', ['getTemplateVm', 'deployTemplate', 'load']);
    api.getTemplateVm.and.returnValue(of({ status: 'initialized' } as Vm));

    await TestBed.configureTestingModule({
      declarations: [VmControllerComponent],
      imports: [AlertModule.forRoot()],
      providers: [
        { provide: VmService, useValue: api },
        { provide: ConfigService, useValue: {} },
        { provide: NotificationService, useValue: { vmEvents: new Subject() } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  function deploy(vm: Vm): HTMLElement {
    api.deployTemplate.and.returnValue(of(vm));
    fixture = TestBed.createComponent(VmControllerComponent);
    fixture.componentInstance.template = { id: 't1', name: 'kali', workspaceId: 'ws1' };
    fixture.detectChanges();
    tick(300);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button[aria-label="deploy"]') as HTMLButtonElement).click();
    tick(300);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the warning a deploy comes back with', fakeAsync(() => {
    const el = deploy({ id: 'vm1', name: 'kali#ws1', capacityWarning: 'Not enough hypervisor memory.' });

    expect(api.deployTemplate).toHaveBeenCalledWith('t1');
    const alert = el.querySelector('alert') as HTMLElement;
    expect(alert.textContent).toContain('Deployed, but the hypervisor may not have room. Not enough hypervisor memory.');
  }));

  it('shows nothing extra when the deploy fits', fakeAsync(() => {
    expect(deploy({ id: 'vm1', name: 'kali#ws1' }).querySelector('alert')).toBeNull();
  }));
});
