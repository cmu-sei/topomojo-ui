import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBrowserComponent } from './user-browser.component';

describe('UserBrowserComponent', () => {
  let component: UserBrowserComponent;
  let fixture: ComponentFixture<UserBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserBrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
