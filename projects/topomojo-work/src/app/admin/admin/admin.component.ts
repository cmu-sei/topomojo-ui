// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, tap } from 'rxjs/operators';
import { AdminService } from '../../api/admin.service';
import { AppVersionInfo } from '../../api/gen/models';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    standalone: false
})
export class AdminComponent implements OnInit {

  section = 'dashboard';
  info: AppVersionInfo = { commit: ''};

  constructor(
    route: ActivatedRoute,
    api: AdminService
  ) {
    route.params.pipe(
      debounceTime(500),
      tap(p => this.section = p.section ?? 'dashboard')
    ).subscribe();

    api.loadVersion().subscribe(
      info => this.info = info
    );
  }

  ngOnInit(): void {
  }

}
