// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { WorkspaceService } from '../api/workspace.service';

@Component({
  selector: 'app-enlist',
  templateUrl: './enlist.component.html',
  styleUrls: ['./enlist.component.scss']
})
export class EnlistComponent implements OnInit {
  message = '';
  constructor(
    route: ActivatedRoute,
    router: Router,
    api: WorkspaceService
  ) {
    route.params.pipe(
      switchMap(p => api.createWorker(p.code))
    ).subscribe(
      ws => router.navigate(['/topo', ws.globalId, 'settings']),
      err => this.message = 'Invalid invitation code.'
    );
  }

  ngOnInit(): void {
  }

}
