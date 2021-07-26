// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { throwError } from 'rxjs';
import { Workspace } from '../api/gen/models';
import { WorkspaceService } from '../api/workspace.service';

@Component({
  selector: 'app-workspace-creator',
  templateUrl: './workspace-creator.component.html',
  styleUrls: ['./workspace-creator.component.scss']
})
export class WorkspaceCreatorComponent implements OnInit {
  errors: Error[] = [];
  faPlus = faPlus;

  constructor(
    private api: WorkspaceService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  add(): void {
    this.api.create({name: 'Workspace Title'})
    // .pipe(ws => throwError({message: 'NotAllowed'}))
    .subscribe(
      (ws: Workspace) => {
        this.router.navigate(['topo', ws.id, 'settings']);
      },
      error => this.errors.push(error)
    );
  }
}
