// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Actor, HubState, NotificationService } from '../notification.service';
import { debounceTime } from 'rxjs/operators';
import { faBolt, faKeyboard, faUser, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-presence-bar',
  templateUrl: './presence-bar.component.html',
  styleUrls: ['./presence-bar.component.scss']
})
export class PresenceBarComponent implements OnInit {
  state$: Observable<HubState>;
  faBolt = faBolt;
  faKeyboard = faKeyboard;
  faUser = faUser;
  faExclamationTriangle = faExclamationTriangle;

  constructor(
    hub: NotificationService
  ) {
    this.state$ = hub.state$.pipe(debounceTime(500));
  }

  ngOnInit(): void {
  }

}
