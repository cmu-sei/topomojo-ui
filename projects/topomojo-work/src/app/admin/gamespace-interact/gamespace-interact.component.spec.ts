import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamespaceInteractComponent } from './gamespace-interact.component';

describe('GamespaceInteractComponent', () => {
  let component: GamespaceInteractComponent;
  let fixture: ComponentFixture<GamespaceInteractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamespaceInteractComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamespaceInteractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
