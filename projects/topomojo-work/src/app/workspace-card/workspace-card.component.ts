// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, Input, Output, OnInit, ViewChild } from '@angular/core';
import { Router, RouterLinkActive } from '@angular/router';
import { WorkspaceSummary } from '../api/gen/models';
import { ConfigService } from '../config.service';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-workspace-card',
    templateUrl: './workspace-card.component.html',
    styleUrls: ['./workspace-card.component.scss'],
    standalone: false
})
export class WorkspaceCardComponent implements OnInit {
  @Input() workspace!: WorkspaceSummary;
  @Input() isFavorite = false;
  @Output() favoriteToggle = new EventEmitter<void>();
  @ViewChild('rla') rla!: RouterLinkActive;
  hovering = false;
  upload_enabled: boolean;

  faStarSolid = faStarSolid;
  faStarRegular = faStarRegular;

  constructor(
    private router: Router,
    config: ConfigService
  ) {
    this.upload_enabled = !!config.settings.enable_upload;
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

  onToggleFavorite(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.favoriteToggle.emit();
  }
}
