// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs';
import { filter, finalize, mergeMap, switchMap, tap } from 'rxjs/operators';
import { ApiSettings } from '../api/api-settings';
import { DocumentService } from '../api/document.service';
import { ImageFile } from '../api/gen/models';
import { faTrash, faArrowDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-image-manager',
  templateUrl: './image-manager.component.html',
  styleUrls: ['./image-manager.component.scss']
})
export class ImageManagerComponent implements OnInit, OnChanges {
  @Input() guid = '';
  @Output() added = new EventEmitter<string>();
  dropzone = false;
  drops = new Subject<FileList>();
  deletes = new Subject<ImageFile>();
  refresh = new BehaviorSubject<boolean>(true);
  images$!: Observable<ImageFile[]>;
  images: ImageFile[] = [];
  activeImage: ImageFile | null = null;
  maxImageSize = 5E7;

  faTrash = faTrash;
  faArrowDown = faArrowDown;

  constructor(
    private api: DocumentService,
    private conf: ApiSettings
  ) {

    this.images$ = this.refresh.pipe(
      switchMap(() => api.listImages(this.guid)),
      tap((list: ImageFile[]) => list.forEach(img => this.setUrl(img))),
      tap((list: ImageFile[]) => this.images = list)
    );

    this.drops.pipe(
      mergeMap((list: FileList) => Array.from(list)),
      filter((f: File) => f.size < this.maxImageSize),
      filter((f: File) => !!f.type.match(/(image|application)\/(png|jpeg|gif|webp|pdf)/)),
      // tap((f: File) => console.log(f.name + ' ' + f.size)),
      mergeMap((f: File) => api.uploadImage(this.guid, f)),
      tap((img: ImageFile) => this.dropped(img))
    ).subscribe();

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.guid) {
      this.refresh.next(true);
    }
  }

  dropped(img: ImageFile): void {
    this.setUrl(img);
    this.images.push(img);
    this.emitMarkdown(img);
  }

  setUrl(img: ImageFile): void {
    img.url = `${this.conf.docs}/${this.guid}/${img.filename}`;
  }

  emitMarkdown(img: ImageFile): void {
    let link = `[${img.filename}](${img.url})`;

    if (img.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      link = '!' + link;
    }

    this.added.emit(link);
  }

  delete(img: ImageFile): void {
    const sub: Subscription = this.api.deleteImage(this.guid, img.filename || '').pipe(
      finalize(() => sub.unsubscribe())
    ).subscribe(() => {
      const target = this.images.findIndex(i => i.filename === img.filename);
      if (target >= 0) {
        this.images.splice(target, 1);
      }
    });
  }

  //
  // Handle component events
  //
  filesSelected(ev: any): void {
    this.drops.next(ev.target.files);
  }

  focus(img: ImageFile): void {
    this.activeImage = img;
  }

  blur(img: ImageFile): void {
    this.activeImage = null;
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
    this.drops.next(event.dataTransfer!.files);
    return false;
  }
}
