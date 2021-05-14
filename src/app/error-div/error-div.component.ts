// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-error-div',
  templateUrl: './error-div.component.html',
  styleUrls: ['./error-div.component.scss']
})
export class ErrorDivComponent implements OnInit {
  @Input() errors!: Error[];

  constructor() { }

  ngOnInit(): void {
  }

}
