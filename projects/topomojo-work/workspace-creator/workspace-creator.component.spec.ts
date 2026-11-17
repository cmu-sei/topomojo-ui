// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceCreatorComponent } from './workspace-creator.component';

describe('WorkspaceCreatorComponent', () => {
  let component: WorkspaceCreatorComponent;
  let fixture: ComponentFixture<WorkspaceCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceCreatorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
