// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-pager',
    templateUrl: './pager.component.html',
    styleUrls: ['./pager.component.scss'],
    standalone: false
})
export class PagerComponent implements OnInit {
  @Input() skip = 0;
  @Input() take = 0;
  @Input() count = 0;
  /** The number of rows across all pages, when the list is paged in the browser and so known. */
  @Input() total?: number;
  @Output() changed = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  get atEnd(): boolean {
    return this.count < this.take || (this.total !== undefined && this.skip + this.take >= this.total);
  }

  next(): void {
    this.changed.next(this.skip + this.take);
  }

  prev(): void {
    this.changed.next(Math.max(0, this.skip - this.take));
  }

  top(): void {
    this.changed.next(0);
  }
}
