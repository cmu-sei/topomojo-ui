// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';
import { WorkspaceSummary } from '../api/gen/models';

@Component({
  selector: 'app-workspace-card',
  templateUrl: './workspace-card.component.html',
  styleUrls: ['./workspace-card.component.scss']
})
export class WorkspaceCardComponent implements OnInit {
  @Input() workspace!: WorkspaceSummary;
  @ViewChild('rla') rla!: RouterLinkActive;
  hovering = false;

  constructor(
    private router: Router,
  ) {
  }

  ngOnInit(): void {
  }

  go(): void {
    if (this.rla.isActive) { return; }
    this.router.navigate(['topo', this.workspace.id, 'settings']);
  }

  keydown(ev: KeyboardEvent): boolean {

    if (this.rla.isActive) { return true; }

    if (ev.code === 'Enter') {
      this.go();
      return false;
    }

    return true;
  }
}
