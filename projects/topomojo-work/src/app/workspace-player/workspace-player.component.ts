// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { Workspace } from '../api/gen/models';

@Component({
  selector: 'app-workspace-player',
  templateUrl: './workspace-player.component.html',
  styleUrls: ['./workspace-player.component.scss']
})
export class WorkspacePlayerComponent implements OnInit {
  @Input() summary!: Workspace;

  constructor() {
  }

  ngOnInit(): void {
  }

}
