import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VmBrowserComponent } from './vm-browser.component';

describe('VmBrowserComponent', () => {
  let component: VmBrowserComponent;
  let fixture: ComponentFixture<VmBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VmBrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VmBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
