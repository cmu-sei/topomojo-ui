// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VariantFormComponent } from './variant-form.component';

describe('VariantFormComponent', () => {
  let component: VariantFormComponent;
  let fixture: ComponentFixture<VariantFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VariantFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VariantFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
