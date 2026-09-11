// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { VmControllerComponent } from './vm-controller.component';
import { VmService } from '../../api/vm.service';
import { ConfigService } from '../../config.service';
import { NotificationService } from '../../notification.service';
import { Subject } from 'rxjs';

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

  it('opens the console with the deployed VM name and isolation ID', () => {
    component.vm = { id: '123', name: 'Ubuntu-Proxmox-304#workspace-id' };
    component.console();
    expect(config.openConsole).toHaveBeenCalledOnceWith({
      name: 'Ubuntu-Proxmox-304', sessionId: 'workspace-id'
    });
  });

  for (const name of [undefined, '', 'Ubuntu-Proxmox-304', '#workspace-id', 'Ubuntu#']) {
    it(`refreshes incomplete VM identity (${name}) instead of opening a malformed URL`, () => {
      component.vm = { id: '123', name };
      const refresh = spyOn(component, 'do');
      component.console();
      expect(config.openConsole).not.toHaveBeenCalled();
      expect(refresh).toHaveBeenCalledOnceWith('refresh');
      expect(component.errors[0].message).toContain('identity is still loading');
    });
  }

  it('opens normally once a delayed identity arrives', () => {
    component.vm = { id: '123', name: '' };
    component.console();
    component.taskResolve({ id: '123', name: 'Ubuntu#workspace-id' });
    component.console();
    expect(config.openConsole).toHaveBeenCalledOnceWith({ name: 'Ubuntu', sessionId: 'workspace-id' });
    expect(component.errors).toEqual([]);
  });
});
