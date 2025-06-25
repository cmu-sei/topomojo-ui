// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, tap, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { Gamespace } from '../api/gen/models';
import { ConfigService } from '../config.service';

@Component({
    selector: 'app-gamespace-preview',
    templateUrl: './gamespace-preview.component.html',
    styleUrls: ['./gamespace-preview.component.scss'],
    standalone: false
})
export class GamespacePreviewComponent implements OnInit {
  gamestate: Observable<Gamespace>;
  section = '';
  guid = '';
  errors: any[] = [];
  err: any;

  constructor(
    config: ConfigService,
    route: ActivatedRoute,
    api: GamespaceService,
    private router: Router,
  ) {

    this.gamestate = route.params.pipe(
      tap(p => this.section = p.slug),
      map(p => p.id),
      debounceTime(500),
      distinctUntilChanged(),
      tap(id => this.guid = id),
      switchMap(id => of(({id} as Gamespace))),
    );

  }

  ngOnInit(): void {
  }

  bail(): void {
    this.router.navigateByUrl('/');
  }

}
