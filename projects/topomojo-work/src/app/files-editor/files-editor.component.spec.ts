// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilesEditorComponent } from './files-editor.component';

describe('FilesEditorComponent', () => {
  let component: FilesEditorComponent;
  let fixture: ComponentFixture<FilesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FilesEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
