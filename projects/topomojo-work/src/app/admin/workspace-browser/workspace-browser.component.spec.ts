import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceBrowserComponent } from './workspace-browser.component';

describe('WorkspaceBrowserComponent', () => {
  let component: WorkspaceBrowserComponent;
  let fixture: ComponentFixture<WorkspaceBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceBrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
