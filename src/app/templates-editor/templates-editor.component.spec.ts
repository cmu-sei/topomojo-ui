// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplatesEditorComponent } from './templates-editor.component';

describe('TemplatesEditorComponent', () => {
  let component: TemplatesEditorComponent;
  let fixture: ComponentFixture<TemplatesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TemplatesEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TemplatesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
