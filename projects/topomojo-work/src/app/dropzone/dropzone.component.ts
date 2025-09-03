// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';

@Component({
    selector: 'app-dropzone',
    templateUrl: './dropzone.component.html',
    styleUrls: ['./dropzone.component.scss'],
    standalone: false
})
export class DropzoneComponent implements OnInit {
  @Output() dropped = new EventEmitter<File[]>();
  dropzone = false;

  constructor() { }

  ngOnInit(): void {
  }

  //
  // Handle component events
  //
  filesSelected(ev: any): void {
    this.dropped.emit(Array.from(ev.target.files));
  }

  //
  // Handle drag/drop events
  //
  @HostListener('dragenter', ['$event'])
  @HostListener('dragover', ['$event'])
  onEnter(event: DragEvent): boolean {
    this.dropzone = true;
    return false;
  }
  @HostListener('dragleave', ['$event'])
  @HostListener('dragexit', ['$event'])
  onLeave(event: DragEvent): boolean {
    this.dropzone = false;
    return false;
  }
  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): boolean {
    this.dropzone = false;
    this.dropped.emit(Array.from(event.dataTransfer?.files || []));
    return false;
  }
}
