// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { Workspace } from '../api/gen/models';

@Component({
    selector: 'app-files-editor',
    templateUrl: './files-editor.component.html',
    styleUrls: ['./files-editor.component.scss'],
    standalone: false
})
export class FilesEditorComponent implements OnInit {
  @Input() summary!: Workspace;

  constructor() { }

  ngOnInit(): void {
  }

}
