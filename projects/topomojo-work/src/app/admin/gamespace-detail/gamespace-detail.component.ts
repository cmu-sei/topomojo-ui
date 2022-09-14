// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { faCode, faKeyboard, faList } from '@fortawesome/free-solid-svg-icons';
import { Gamespace } from '../../api/gen/models';

@Component({
  selector: 'app-gamespace-detail',
  templateUrl: './gamespace-detail.component.html',
  styleUrls: ['./gamespace-detail.component.scss']
})
export class GamespaceDetailComponent implements OnInit {
  @Input() detail: any;
  @Input() gamespace!: Gamespace;
  showing = 'default';
  faJson = faCode;
  faKeyboard = faKeyboard;
  faList = faList;

  constructor(
  ) { }

  ngOnInit(): void {
  }

  show(mode: string): void {
    this.showing = mode;
  }
}
