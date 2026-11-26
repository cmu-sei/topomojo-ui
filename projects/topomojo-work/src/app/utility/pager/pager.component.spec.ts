// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagerComponent } from './pager.component';

describe('PagerComponent', () => {
  let fixture: ComponentFixture<PagerComponent>;
  let pager: PagerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ declarations: [PagerComponent] }).compileComponents();
    fixture = TestBed.createComponent(PagerComponent);
    pager = fixture.componentInstance;
  });

  it('without a total, Next is live whenever the page is full (the server decides)', () => {
    pager.skip = 100; pager.take = 100; pager.count = 100;
    expect(pager.atEnd).toBeFalse();
    pager.count = 40;
    expect(pager.atEnd).toBeTrue();
  });

  it('with a total, Next is off on the last page even when that page is full', () => {
    pager.skip = 100; pager.take = 100; pager.count = 100; pager.total = 200;
    expect(pager.atEnd).toBeTrue();
    pager.skip = 0; pager.count = 100;
    expect(pager.atEnd).toBeFalse();
  });

  it('emits the next and previous page starts', () => {
    const emitted: number[] = [];
    pager.changed.subscribe((n: number) => emitted.push(n));
    pager.skip = 100; pager.take = 100; pager.count = 100;
    pager.next();
    pager.prev();
    expect(emitted).toEqual([200, 0]);
  });
});
