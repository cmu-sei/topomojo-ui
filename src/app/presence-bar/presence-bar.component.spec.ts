// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PresenceBarComponent } from './presence-bar.component';

describe('PresenceBarComponent', () => {
  let component: PresenceBarComponent;
  let fixture: ComponentFixture<PresenceBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PresenceBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PresenceBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
