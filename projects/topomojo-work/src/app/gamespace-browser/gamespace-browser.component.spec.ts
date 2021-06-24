import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamespaceBrowserComponent } from './gamespace-browser.component';

describe('GamespaceBrowserComponent', () => {
  let component: GamespaceBrowserComponent;
  let fixture: ComponentFixture<GamespaceBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamespaceBrowserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamespaceBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
