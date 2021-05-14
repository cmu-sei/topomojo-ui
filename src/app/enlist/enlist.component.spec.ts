// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnlistComponent } from './enlist.component';

describe('EnlistComponent', () => {
  let component: EnlistComponent;
  let fixture: ComponentFixture<EnlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
