// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkspaceSummary } from '../api/gen/models';

@Component({
  selector: 'app-workspace-card',
  templateUrl: './workspace-card.component.html',
  styleUrls: ['./workspace-card.component.scss']
})
export class WorkspaceCardComponent implements OnInit {
  @Input() workspace!: WorkspaceSummary;
  hovering = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
  }

}
