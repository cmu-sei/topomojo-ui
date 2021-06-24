import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamespaceCardComponent } from './gamespace-card.component';

describe('GamespaceCardComponent', () => {
  let component: GamespaceCardComponent;
  let fixture: ComponentFixture<GamespaceCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamespaceCardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamespaceCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
