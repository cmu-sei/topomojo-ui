// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ClipboardService } from '../clipboard.service';
import { faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-clipspan',
  templateUrl: './clipspan.component.html',
  styleUrls: ['./clipspan.component.scss']
})
export class ClipspanComponent implements OnInit {
  @ViewChild('span') span!: ElementRef;
  clipped = false;
  hovering = false;
  icon = faClipboard;
  iconChecked = faClipboardCheck;

  constructor(
    private svc: ClipboardService
  ) { }

  ngOnInit(): void {
  }

  hover(h: boolean): void {
    this.hovering = h;
  }

  copy(): void {
    this.svc.copyToClipboard(this.span.nativeElement.innerText);
    this.clipped = true;
    const s: Subscription = timer(4000).pipe(
      tap(() => this.clipped = false),
      finalize(() => s.unsubscribe())
    ).subscribe();
  }
}
