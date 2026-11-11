// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AlertModule } from 'ngx-bootstrap/alert';
import { of } from 'rxjs';
import { GamespaceService } from '../api/gamespace.service';
import { GameState, Workspace } from '../api/gen/models';
import { ConfigService } from '../config.service';
import { ClockPipe } from '../utility/clock.pipe';

import { WorkspacePlayerComponent } from './workspace-player.component';

const notStarted = {
  name: 'Lab',
  session: { isBefore: true, isDuring: false, isAfter: false },
  gameOver: false
} as unknown as GameState;

describe('WorkspacePlayerComponent', () => {
  let component: WorkspacePlayerComponent;
  let fixture: ComponentFixture<WorkspacePlayerComponent>;
  let api: jasmine.SpyObj<GamespaceService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<GamespaceService>('GamespaceService', ['load', 'preview', 'register', 'delete', 'transform']);
    api.load.and.returnValue(of({} as GameState));
    api.preview.and.returnValue(of(notStarted));
    api.transform.and.callFake((g: any) => g);

    await TestBed.configureTestingModule({
      declarations: [ WorkspacePlayerComponent, ClockPipe ],
      imports: [ FormsModule, AlertModule.forRoot() ],
      providers: [
        { provide: GamespaceService, useValue: api },
        { provide: ConfigService, useValue: {} }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();
  });

  function render(): HTMLElement {
    fixture = TestBed.createComponent(WorkspacePlayerComponent);
    component = fixture.componentInstance;
    component.summary = { id: 'ws1', name: 'Lab' } as Workspace;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should create', fakeAsync(() => {
    render();
    expect(component).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('shows the capacity estimate', fakeAsync(() => {
    expect(render().querySelector('app-workspace-capacity')).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('shows the warning a start comes back with', fakeAsync(() => {
    const el = render();
    api.register.and.returnValue(of({
      ...notStarted,
      id: 'g1',
      capacityWarning: 'Not enough hypervisor memory: this deploy needs 16.0 GB and 10.0 GB is free after 20% headroom.'
    }));

    component.launch();
    tick();
    fixture.detectChanges();

    const alert = el.querySelector('alert') as HTMLElement;
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Started, but the hypervisor may not have room.');
    expect(alert.textContent).toContain('needs 16.0 GB and 10.0 GB is free');
    discardPeriodicTasks();
  }));

  it('shows no warning when the start fits', fakeAsync(() => {
    const el = render();
    api.register.and.returnValue(of({ ...notStarted, id: 'g1' }));

    component.launch();
    tick();
    fixture.detectChanges();

    expect(el.querySelector('alert')).toBeNull();
    discardPeriodicTasks();
  }));
});
