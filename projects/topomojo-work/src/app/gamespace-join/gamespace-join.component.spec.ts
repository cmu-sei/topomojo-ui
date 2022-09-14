// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamespaceJoinComponent } from './gamespace-join.component';

describe('GamespaceJoinComponent', () => {
  let component: GamespaceJoinComponent;
  let fixture: ComponentFixture<GamespaceJoinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamespaceJoinComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamespaceJoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
