// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorDivComponent } from './error-div.component';

describe('ErrorDivComponent', () => {
  let component: ErrorDivComponent;
  let fixture: ComponentFixture<ErrorDivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ErrorDivComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorDivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
