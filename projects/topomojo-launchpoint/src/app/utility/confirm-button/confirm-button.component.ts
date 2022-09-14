// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-confirm-button',
  templateUrl: './confirm-button.component.html',
  styleUrls: ['./confirm-button.component.scss']
})
export class ConfirmButtonComponent implements OnInit {
  @Input() btnClass = 'btn';
  @Input() disabled = false;
  @Output() confirm = new EventEmitter<boolean>();
  confirming = false;

  faCheck = faCheck;
  faTimes = faTimes;

  constructor() { }

  ngOnInit(): void {
  }

  continue(yes?: boolean): void {
    if (!!yes) { this.confirm.emit(true); }
    this.confirming = false;
  }

}
