// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';
import { PagerComponent } from '../../utility/pager/pager.component';
import { VmBrowserComponent } from './vm-browser.component';

function makeVms(n: number): Vm[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `id-${i}`,
    name: `vm-${String(i + 1).padStart(3, '0')}`,
    groupName: `workspace: Alpha ${i}#00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
    host: `host${i % 3}.example.com`,
    state: 'running'
  } as unknown as Vm));
}

describe('VmBrowserComponent', () => {
  let fixture: ComponentFixture<VmBrowserComponent>;
  let component: VmBrowserComponent;
  let list: jasmine.Spy;

  async function create(vms: Vm[]): Promise<void> {
    list = jasmine.createSpy('list').and.returnValue(of(vms));
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [VmBrowserComponent, PagerComponent],
      providers: [{ provide: VmService, useValue: { list } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(VmBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  const names = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.text-break')).map(e => e.textContent!.trim());

  it('shows the first page of 100 machines with an "n of N" count and a pager', async () => {
    await create(makeVms(250));
    expect(names().length).toBe(100);
    expect(names()[0]).toBe('vm-001');
    expect(text()).toContain('250 of 250');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-pager')).not.toBeNull();
  });

  it('moves to the next page and back', async () => {
    await create(makeVms(250));
    component.paged(100);
    fixture.detectChanges();
    expect(names()[0]).toBe('vm-101');
    expect(names().length).toBe(100);
    component.paged(200);
    fixture.detectChanges();
    expect(names().length).toBe(50);
    component.paged(0);
    fixture.detectChanges();
    expect(names()[0]).toBe('vm-001');
  });

  it('a new search term narrows the list, updates the count and returns to the first page', async () => {
    await create(makeVms(250));
    component.paged(100);
    component.search.term = 'vm-01';
    component.changed();
    fixture.detectChanges();
    expect(component.skip).toBe(0);
    expect(names().length).toBe(10);
    expect(text()).toContain('10 of 250');
  });

  it('sorting returns to the first page and does not ask the API again', async () => {
    await create(makeVms(250));
    component.paged(100);
    component.sortBy('name');
    fixture.detectChanges();
    expect(component.skip).toBe(0);
    expect(names()[0]).toBe('vm-250');
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('says so when there are no machines', async () => {
    await create([]);
    expect(text()).toContain('None found.');
    expect(text()).not.toContain(' of ');
  });

  it('says so when the search matches nothing', async () => {
    await create(makeVms(5));
    component.search.term = 'zzz';
    component.changed();
    fixture.detectChanges();
    expect(text()).toContain('No matches.');
    expect(text()).toContain('Clear the search.');
    expect(text()).toContain('0 of 5');
  });

  it('Refresh asks the API again', async () => {
    await create(makeVms(3));
    const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(b => b.textContent!.includes('Refresh')) as HTMLButtonElement;
    expect(button).toBeDefined();
    button.click();
    fixture.detectChanges();
    expect(list).toHaveBeenCalledTimes(2);
  });
});
