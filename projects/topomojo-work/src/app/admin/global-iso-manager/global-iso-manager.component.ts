// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { GLOBAL_WORKSPACE_ID } from '../../constants';

@Component({
    selector: 'app-global-iso-manager',
    templateUrl: './global-iso-manager.component.html',
    styleUrls: ['./global-iso-manager.component.scss'],
    standalone: false
})
export class GlobalIsoManagerComponent implements OnInit {
  globalGuid = GLOBAL_WORKSPACE_ID;

  constructor() { }

  ngOnInit(): void {
  }

}
