// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceEditorComponent } from './workspace-editor.component';

describe('WorkspaceEditorComponent', () => {
  let component: WorkspaceEditorComponent;
  let fixture: ComponentFixture<WorkspaceEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
