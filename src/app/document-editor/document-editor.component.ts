// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Workspace } from '../api/gen/models';
import { interval, Observable, of, Subject } from 'rxjs';
import { DocumentService } from '../api/document.service';
import { catchError, debounceTime, filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { faCloudUploadAlt, faImages, faFileImage } from '@fortawesome/free-solid-svg-icons';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'app-document-editor',
  templateUrl: './document-editor.component.html',
  styleUrls: ['./document-editor.component.scss']
})
export class DocumentEditorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() summary!: Workspace;
  docid$ = new Subject<string>();
  dirty$ = new Subject<boolean>();
  saved$ = new Observable<boolean>();
  editorModel$ = new Observable<NgxEditorModel>();
  doctext = '';
  showPreview = false;
  showImageManager = false;

  faSave = faCloudUploadAlt;
  faImage = faImages;
  faFile = faFileImage;

  editorOptions: monaco.editor.IEditorOptions = {
    // theme: 'vs-dark',
    minimap: { enabled: false },
    lineNumbers: 'off',
    quickSuggestions: false,
    readOnly: false, // this.readOnly,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    linkedEditing: true,
    fixedOverflowWidgets: true
  };

  private editor!: monaco.editor.ICodeEditor;

  constructor(
    private api: DocumentService
  ) {
    this.editorModel$ = this.docid$.pipe(
      debounceTime(500),
      filter(id => !!id),
      switchMap(id => this.api.getDocument(id).pipe(
        catchError(err => of(''))
      )),
      tap(text => this.doctext = text),
      map(text => ({
        value: text,
        language: 'markdown'
      }) as NgxEditorModel)
    );

    this.saved$ = this.dirty$.pipe(
      debounceTime(3000),
      switchMap(() => api.updateDocument(this.summary.globalId, this.doctext)),
      mergeMap(() => interval(4000).pipe(
        map(i => !(i % 2)),
        take(2)
      )),
      tap(i => console.log(i))
    );
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    // initial "change" happens before subscription, so fire here after subscribed
    this.docid$.next(this.summary.globalId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.docid$.next(changes.summary.currentValue.globalId);
  }

  editorInit(editor: monaco.editor.ICodeEditor): void {
    this.editor = editor;
    editor.onDidChangeModelContent((ev: monaco.editor.IModelContentChangedEvent) => {
      this.doctext = this.editor.getValue();
      this.dirty$.next(true);
    });
  }

  insertImage(text: string): void {
    text = `\n${text}\n\n`;
    const range = this.editor.getSelection() || new monaco.Selection(1, 1, 1, 1);
    this.editor.executeEdits('image-manager', [{range, text, forceMoveMarkers: true}], );
    this.editor.focus();
  }

  showSaved(ts: number): boolean {
    const t = Date.now() - ts;
    return t < 2000;
  }
}
