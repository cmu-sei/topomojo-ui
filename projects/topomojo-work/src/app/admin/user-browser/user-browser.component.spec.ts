// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProfileService } from '../../api/profile.service';
import { PagerComponent } from '../../utility/pager/pager.component';
import { UserBrowserComponent } from './user-browser.component';

// The Users page shares one layout with Templates, Workspaces and Gamespaces: a description in a
// .mb-2 block, a search group in a .mb-2 block whose label says what the search covers, filters
// separated by a muted "|", and a "Tip:" line under the filters. Role colors and the extra filters stay.
describe('UserBrowserComponent layout', () => {
  let fixture: ComponentFixture<UserBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [UserBrowserComponent, PagerComponent],
      providers: [{ provide: ProfileService, useValue: { list: () => of([]), listScopes: () => of(['scope-a', 'scope-b']) } }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(UserBrowserComponent);
    fixture.detectChanges();
  });

  const root = () => fixture.nativeElement as HTMLElement;

  it('wraps the description in a .mb-2 block like the other pages', () => {
    const description = root().querySelector('div.mb-2 > div.text-muted');
    expect(description).not.toBeNull();
    expect(description!.textContent).toContain('Manage TopoMojo users');
  });

  it('wraps the search group in a .mb-2 block and labels what it searches', () => {
    const group = root().querySelector('div.mb-2 > .input-group');
    expect(group).not.toBeNull();
    const label = group!.querySelector('.input-group-text') as HTMLElement;
    expect(label.getAttribute('aria-label')).toContain('Search users by name');
    expect(group!.querySelector('input')!.getAttribute('aria-label')).toBe('search users');
  });

  it('separates the filters with a muted bar and keeps the role, service account and scope filters', () => {
    const bars = Array.from(root().querySelectorAll('span.text-muted')).filter(e => e.textContent!.trim() === '|');
    expect(bars.length).toBe(3);
    const labels = Array.from(root().querySelectorAll('button')).map(b => b.textContent!.trim());
    for (const wanted of ['create', 'admins', 'observers', 'creators', 'builders', 'service accounts', 'scope-a', 'scope-b']) {
      expect(labels).toContain(wanted);
    }
  });

  it('puts the tip under the filters', () => {
    const tip = root().querySelector('small.text-muted.d-block');
    expect(tip).not.toBeNull();
    expect(tip!.textContent!.trim()).toMatch(/^Tip:/);
  });

  it('describes the search box for screen readers', () => {
    const input = root().querySelector('input[type=search]') as HTMLInputElement;
    const hint = root().querySelector('#' + input.getAttribute('aria-describedby'));
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Search users by name');
  });
});
