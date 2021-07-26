// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { Subject } from 'rxjs';
import { debounceTime, finalize, mergeMap, tap } from 'rxjs/operators';
import { FileService } from '../api/file.service';
import { IsoSelectorComponent } from '../iso-selector/iso-selector.component';

@Component({
  selector: 'app-iso-manager',
  templateUrl: './iso-manager.component.html',
  styleUrls: ['./iso-manager.component.scss']
})
export class IsoManagerComponent implements OnInit, OnChanges {
  @Input() guid = '';
  @ViewChild('selector') selector!: IsoSelectorComponent;
  drops = new Subject<File[]>();
  pending: FileProgress[] = [];
  finished$ = new Subject<boolean>();

  faFile = faFile;

  constructor(
    api: FileService
  ) {

    this.drops.pipe(
      mergeMap((list: File[]) => list),
      tap((f: File) => console.log(f.name + ' ' + f.size)),
      mergeMap((f: File) => api.uploadIso(this.guid, f).pipe(
        tap((e: HttpEvent<any>) => this.progress(e, f)),
        finalize(() => this.progressEnd(f))
      ), 3),
    ).subscribe();

    this.finished$.pipe(
      debounceTime(2000)
    ).subscribe(() => this.selector.refresh(true));
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.guid){
      this.pending = [];
    }
  }

  progressEnd(f: File): void {
    const item = this.pending.find(i => i.name === f.name);
    if (!!item) {
      item.progress = 0;
      this.finished$.next(true);
    }
  }

  progress(e: HttpEvent<any>, f: File): void {
    if (e.type !== HttpEventType.UploadProgress) { return; }
    const progress = Math.ceil(e.loaded / (e.total || e.loaded) * 100);
    const item = this.pending.find(i => i.name === f.name);
    if (!!item) {
      item.progress = progress;
    } else {
      this.pending.push({
        name: f.name,
        progress
      });
    }
  }

  onDrop(files: File[]): void {
    this.drops.next(files);
  }

}

interface FileProgress {
  name: string;
  progress: number;
  error?: Error;
}
