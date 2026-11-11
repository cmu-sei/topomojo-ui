// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Template, Workspace } from '../api/gen/models';
import { WorkspaceCapacity, WorkspaceService } from '../api/workspace.service';
import { WorkspaceCapacityComponent } from './workspace-capacity.component';

const estimate = (patch: Partial<WorkspaceCapacity> = {}): WorkspaceCapacity => ({
  workspaceId: 'ws1',
  provider: 'proxmox',
  asOf: '2026-11-11T12:00:00Z',
  requested: 1,
  fits: 12,
  sufficient: true,
  limitedBy: 'memory',
  headroomPercent: 20,
  perInstance: { vmCount: 3, memoryMb: 6144, vcpu: 6 },
  memoryFreeMb: 77824,
  memoryTotalMb: 131072,
  cpuCores: 32,
  cpuUsagePercent: 12,
  ...patch
});

const workspace = (replicas: number[] = [0]): Workspace => ({
  id: 'ws1',
  name: 'Lab',
  templates: replicas.map((r, i) => ({ id: `t${i}`, name: `t${i}`, replicas: r } as Template))
} as Workspace);

describe('WorkspaceCapacityComponent', () => {
  let fixture: ComponentFixture<WorkspaceCapacityComponent>;
  let component: WorkspaceCapacityComponent;
  let api: jasmine.SpyObj<WorkspaceService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<WorkspaceService>('WorkspaceService', ['getCapacity']);
    api.getCapacity.and.returnValue(of(estimate()));

    await TestBed.configureTestingModule({
      declarations: [WorkspaceCapacityComponent],
      imports: [FormsModule],
      providers: [{ provide: WorkspaceService, useValue: api }]
    }).compileComponents();
  });

  function render(ws: Workspace = workspace()): HTMLElement {
    fixture = TestBed.createComponent(WorkspaceCapacityComponent);
    component = fixture.componentInstance;
    component.workspace = ws;
    component.ngOnChanges();
    tick(300);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const text = (el: HTMLElement) => el.textContent!.replace(/\s+/g, ' ');

  it('says how many more fit and what limits it', fakeAsync(() => {
    const el = render();

    expect(api.getCapacity).toHaveBeenCalledWith('ws1', 1);
    expect(el.querySelector('strong')!.textContent).toContain('12 more gamespaces fit');
    expect(text(el)).toContain('limited by hypervisor memory: 76.0 GB free after 20% headroom, 6.0 GB each (3 VMs)');
  }));

  it('names the resource pool limit when it decides', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(estimate({ fits: 1, limitedBy: 'pool' })));

    const el = render();

    expect(el.querySelector('strong')!.textContent).toContain('1 more gamespace fits');
    expect(text(el)).toContain('limited by the resource pool limit');
  }));

  it('flags when none fit', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(estimate({ fits: 0, sufficient: false })));

    const strong = render().querySelector('strong')!;

    expect(strong.textContent).toContain('No more gamespaces fit');
    expect(strong.classList).toContain('text-danger');
  }));

  it('says nothing limits a workspace without templates', fakeAsync(() => {
    api.getCapacity.and.returnValue(of(estimate({ fits: null, limitedBy: null })));

    const el = render();

    expect(el.querySelector('strong')!.textContent).toContain('nothing limits how many fit');
    expect(text(el)).not.toContain('headroom');
  }));

  it('notes when the hypervisor cannot be read and offers a retry', fakeAsync(() => {
    api.getCapacity.and.returnValue(throwError(() => ({ status: 500 })));

    const el = render();

    expect(text(el)).toContain("free memory can't be read right now");
    expect(el.querySelector('button')!.textContent).toContain('Retry');

    api.getCapacity.and.returnValue(of(estimate()));
    (el.querySelector('button') as HTMLButtonElement).click();
    tick(300);
    fixture.detectChanges();

    expect(text(el)).toContain('12 more gamespaces fit');
    expect(text(el)).not.toContain("can't be read");
  }));

  it('asks for players only when replicas follow the player count', fakeAsync(() => {
    expect(render(workspace([0, 2])).querySelector('input')).toBeNull();
  }));

  it('re-estimates for the players entered', fakeAsync(() => {
    const el = render(workspace([0, -1]));
    const input = el.querySelector('input') as HTMLInputElement;
    expect(input).toBeTruthy();

    input.value = '4';
    input.dispatchEvent(new Event('input'));
    tick(300);

    expect(api.getCapacity).toHaveBeenCalledWith('ws1', 4);
  }));
});
