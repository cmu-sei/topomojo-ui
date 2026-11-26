// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ButtonsModule } from 'ngx-bootstrap/buttons';
import { of, throwError } from 'rxjs';
import { AdminService, TemplateSource, TemplateSourceReport } from '../../api/admin.service';
import { PagerComponent } from '../../utility/pager/pager.component';
import { DiskBrowserComponent } from './disk-browser.component';

function sources(global: number, owned: number): TemplateSource[] {
  const pad = (i: number) => String(i).padStart(3, '0');
  return [
    ...Array.from({ length: global }, (_, i) => ({
      name: `[ds] 00000000-0000-0000-0000-000000000000/global-${pad(i)}.vmdk`,
      isGlobal: true,
      modified: '2026-03-16T13:00:00Z'
    })),
    ...Array.from({ length: owned }, (_, i) => ({
      name: `[ds] mojotst0123/owned-${pad(i)}.vmdk`,
      isGlobal: false,
      workspaceName: `Workspace ${i}`,
      templateName: `template-${i}`,
      modified: '2026-03-16T13:00:00Z'
    }))
  ];
}

describe('DiskBrowserComponent', () => {
  let fixture: ComponentFixture<DiskBrowserComponent>;
  let component: DiskBrowserComponent;
  let getTemplateSources: jasmine.Spy;

  async function create(result: TemplateSourceReport | Error): Promise<void> {
    getTemplateSources = jasmine.createSpy('getTemplateSources')
      .and.returnValue(result instanceof Error ? throwError(() => result) : of(result));
    await TestBed.configureTestingModule({
      imports: [FormsModule, ButtonsModule],
      declarations: [DiskBrowserComponent, PagerComponent],
      providers: [{ provide: AdminService, useValue: { getTemplateSources } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(DiskBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const root = () => fixture.nativeElement as HTMLElement;
  const text = () => root().textContent!.replace(/\s+/g, ' ');
  const names = () => Array.from(root().querySelectorAll('.name-cell')).map(e => e.textContent!.trim());

  it('lists the global disks first, 100 to a page, with an "n of N" count and a pager', async () => {
    await create({ enabled: true, field: 'disks', sources: sources(120, 30) });
    expect(names().length).toBe(100);
    expect(text()).toContain('120 of 150');
    expect(root().querySelector('app-pager')).not.toBeNull();
  });

  it('uses the same row layout as the other admin lists, not a table', async () => {
    await create({ enabled: true, field: 'disks', sources: sources(3, 0) });
    expect(root().querySelector('table')).toBeNull();
    expect(root().querySelector('.row.disk-header')).not.toBeNull();
    expect(root().querySelector('hr')).not.toBeNull();
  });

  it('Global Only off also lists workspace disks, and the search narrows them', async () => {
    await create({ enabled: true, field: 'disks', sources: sources(120, 30) });
    component.globalOnly = false;
    component.changed();
    fixture.detectChanges();
    expect(text()).toContain('150 of 150');

    component.term = 'template-7';
    component.changed();
    fixture.detectChanges();
    expect(names().length).toBe(1);
    expect(text()).toContain('1 of 150');
  });

  it('moves between pages, and a changed search returns to the first page', async () => {
    await create({ enabled: true, field: 'disks', sources: sources(250, 0) });
    component.paged(200);
    fixture.detectChanges();
    expect(names().length).toBe(50);
    expect(names()[0]).toContain('global-200.vmdk');

    component.term = 'global-01';
    component.changed();
    fixture.detectChanges();
    expect(component.skip).toBe(0);
    expect(names().length).toBe(10);
  });

  it('explains an empty result', async () => {
    await create({ enabled: true, field: 'disks', sources: sources(3, 2) });
    component.term = 'zzz';
    component.changed();
    fixture.detectChanges();
    expect(text()).toContain('No matches.');
    expect(text()).toContain('Clear the search or turn off Global Only.');
  });

  it('says so when no disks were found', async () => {
    await create({ enabled: true, field: 'disks', sources: [] });
    expect(text()).toContain('None found.');
  });

  it('says so when the list is turned off in the API', async () => {
    await create({ enabled: false, sources: [] });
    expect(text()).toContain('The Disks tab is turned off');
  });

  it('shows the API error with a Refresh button, and Refresh asks again', async () => {
    await create(new Error('boom'));
    expect(root().querySelector('.alert-danger')).not.toBeNull();
    const refresh = Array.from(root().querySelectorAll('button')).find(b => b.textContent!.includes('Refresh')) as HTMLButtonElement;
    refresh.click();
    expect(getTemplateSources).toHaveBeenCalledTimes(2);
  });

  it('titles a Proxmox list "Template VMs" and its date column "Created"', async () => {
    await create({ enabled: true, field: 'template', sources: sources(2, 0).map(s => ({ ...s, created: s.modified, modified: undefined })) });
    expect(text()).toContain('Template VMs');
    expect(root().querySelector('.disk-header')!.textContent).toContain('Created');
  });
});
