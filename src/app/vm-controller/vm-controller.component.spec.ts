// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VmControllerComponent } from './vm-controller.component';

describe('VmControllerComponent', () => {
  let component: VmControllerComponent;
  let fixture: ComponentFixture<VmControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VmControllerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VmControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
