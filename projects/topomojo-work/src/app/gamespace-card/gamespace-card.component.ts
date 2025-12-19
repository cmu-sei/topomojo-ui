// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit, ViewChild, EventEmitter, Output } from '@angular/core';
import { RouterLinkActive, Router } from '@angular/router';
import { interval, Observable } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { Gamespace } from '../api/gen/models';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-gamespace-card',
    templateUrl: './gamespace-card.component.html',
    styleUrls: ['./gamespace-card.component.scss'],
    standalone: false
})
export class GamespaceCardComponent implements OnInit {
  @Input() gamespace!: Gamespace;
  @ViewChild('rla') rla!: RouterLinkActive;
  @Input() isFavorite = false;
  @Input() canFavorite = true;
  @Output() favoriteToggle = new EventEmitter<void>();
  faStarSolid = faStarSolid;
  faStarRegular = faStarRegular;
  hovering = false;
  countdown$!: Observable<number>;

  constructor( private router: Router) {}

  ngOnInit(): void {
    this.countdown$ = interval(1000).pipe(
      map(() => {
        const exp = this.gamespace?.expirationTime
          ? new Date(this.gamespace.expirationTime).valueOf()
          : 0;
        return exp - Date.now();
      }),
      takeWhile(i => i > 0)
    );
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

  onToggleFavorite(ev: MouseEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    this.favoriteToggle.emit();
  }

}
