// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { RouterLinkActive, Router } from '@angular/router';
import { interval, Observable } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { Gamespace } from '../api/gen/models';

@Component({
  selector: 'app-gamespace-card',
  templateUrl: './gamespace-card.component.html',
  styleUrls: ['./gamespace-card.component.scss']
})
export class GamespaceCardComponent implements OnInit {
  @Input() gamespace!: Gamespace;
  @ViewChild('rla') rla!: RouterLinkActive;
  hovering = false;
  countdown$: Observable<number>;

  constructor(
    private router: Router,
  ) {
    this.countdown$ = interval(1000).pipe(
      map(() => (!!this.gamespace?.expirationTime
        ? new Date(this.gamespace?.expirationTime).valueOf()
        : 0) - Date.now()),
        takeWhile(i => i > 0)
    );
  }

  ngOnInit(): void {
  }

  go(): void {
    if (this.rla.isActive) { return; }
    this.router.navigate(['/mojo', this.gamespace.id, this.gamespace.slug]);
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
