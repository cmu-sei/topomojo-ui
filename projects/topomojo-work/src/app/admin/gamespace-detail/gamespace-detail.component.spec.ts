import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamespaceDetailComponent } from './gamespace-detail.component';

describe('GamespaceDetailComponent', () => {
  let component: GamespaceDetailComponent;
  let fixture: ComponentFixture<GamespaceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GamespaceDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GamespaceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
