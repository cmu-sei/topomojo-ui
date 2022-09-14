// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObserveComponent } from './observe.component';

describe('ObserveComponent', () => {
  let component: ObserveComponent;
  let fixture: ComponentFixture<ObserveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ObserveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ObserveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
