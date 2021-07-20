import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamespaceStateComponent } from './gamespace-state.component';

describe('GamespaceStateComponent', () => {
  let component: GamespaceStateComponent;
  let fixture: ComponentFixture<GamespaceStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamespaceStateComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamespaceStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
