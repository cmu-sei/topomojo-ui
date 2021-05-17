// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Workspace } from '../api/gen/models';
import { BehaviorSubject, fromEvent, interval, Observable, of, Subject, Subscription } from 'rxjs';
import { DocumentService } from '../api/document.service';
import { auditTime, catchError, debounceTime, filter, map, mergeMap, reduce, switchMap, take, tap } from 'rxjs/operators';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { faCloudUploadAlt, faImages, faFileImage } from '@fortawesome/free-solid-svg-icons';
import * as monaco from 'monaco-editor';
import { NotificationService, HubEvent, Actor } from '../notification.service';

@Component({
  selector: 'app-document-editor',
  templateUrl: './document-editor.component.html',
  styleUrls: ['./document-editor.component.scss']
})
export class DocumentEditorComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
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

  private editorViewState?: EditorViewState;
  private editorFocused: boolean = true;

  private decorations: string[] = [];
  
  private selections$ = new BehaviorSubject<CursorSelection[]>([]);
  private colors = ['green', 'purple ', 'pride-yellow', 'magenta', 'sienna', 'darkolive',  'cyan', 'red', 'brown', 'seagreen ', 'pink', 'pride-red', 'pride-orange', 'teal'];
  private newColorIndex = 0;
  private remoteUsers = new Map<string, RemoteUserData>();

  private selectionSub: Subscription;
  private documentSub: Subscription;
  private presenceSub: Subscription;

  private edits$ = new Subject<ChangeEvent>();

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
    private api: DocumentService,
    private hub: NotificationService
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

    this.documentSub = this.hub.documentEvents.subscribe(
      (event: HubEvent) => {
        if (event.action === 'DOCUMENT.CURSOR') { 
          this.updateRemotePositions(event.actor, event.model);
        }
      }
    );

    this.selectionSub = this.selections$.pipe(
      filter(() => true),
      auditTime(1000), // Not that important, don't send updates as frequently
      map((selections) => this.mapToSelectionsDTO(selections))
    ).subscribe(
      (selections) => {
        this.hub.cursorChanged(selections);
      }
    );

    this.presenceSub = this.hub.presenceEvents.subscribe(
      (event: HubEvent) => {
        if (event.action === 'PRESENCE.ARRIVED' || event.action === 'PRESENCE.GREETED') {
          this.forwardCursorSelections(this.selections$.value);
        }
      }
    );

  }
  ngOnDestroy(): void {
    this.documentSub.unsubscribe();
    this.presenceSub.unsubscribe();
    this.selectionSub.unsubscribe();
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

  editorInit(editor: Editor): void {
    this.editor = editor;
    if (this.editorViewState)
      this.restoreEditorViewState();
    else
      this.saveEditorViewState();
    editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF); // must be consistent across browsers
    this.applyDecorations();
    this.editor.onDidChangeCursorPosition((event) => this.editorViewChanged(event.reason) );
    this.editor.onDidChangeCursorSelection((event) => {
      this.editorViewChanged(event.reason);
      this.changedCursorSelections(event);
    });
    this.editor.onDidScrollChange(() => this.editorViewChanged() );
    // Keep track of focus status to reset properly 
    this.editor.onDidFocusEditorWidget(() => this.editorFocused = true );
    this.editor.onDidBlurEditorWidget(() => this.editorFocused = false );
    editor.onDidChangeModelContent((ev: monaco.editor.IModelContentChangedEvent) => {
      this.doctext = this.editor.getValue();
      this.dirty$.next(true);
    });
  }

  private saveEditorViewState() {
    this.editorViewState = this.editor?.saveViewState() ?? undefined;
  }
  
  private restoreEditorViewState() {
    this.editor?.restoreViewState(this.editorViewState!);
    if (this.editorFocused)
      this.editor?.focus();
    // this.tooltipMessage = this.editor.getContribution('editor.contrib.messageController');
  }
  
  private editorViewChanged(reason?: CursorChangeReason) {
    if (reason && reason == CursorChangeReason.ContentFlush)
      this.restoreEditorViewState();
    else
      this.saveEditorViewState();
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

  changedCursorSelections(event: monaco.editor.ICursorSelectionChangedEvent) {
    if (event.reason == CursorChangeReason.ContentFlush)
      return;
    const selections = [event.selection, ...event.secondarySelections]
    this.forwardCursorSelections(selections);
  }

  forwardCursorSelections(selections: Array<monaco.Selection> | null) {
    if (selections == null || selections.length == 0) {
      this.selections$.next([new monaco.Selection(1, 1, 1, 1)]);
      return;
    }
    this.selections$.next(selections);
  }

  updateRemotePositions(actor: Actor, selections: any[]) {
    if (this.remoteUsers.has(actor.id)) {
      var user = this.remoteUsers.get(actor.id)!;
    } else {
      var user = this.newUserData(actor.name);
      this.remoteUsers.set(actor.id, user);
    }
    user.positions = [];
    // Could apply transformations here, but probably not worth the computation
    selections.forEach(selection => {
      user.positions.push({
        range: this.mapFromRangeDTO(selection),
        rtl: selection.r ?? false
      })
    });
    this.applyDecorations();
  }

  applyDecorations(reset?: boolean) {
    if (!this.editor)
      return;
    if (reset) 
      this.decorations = [];
    var newDecorations: any[] = [];
    this.remoteUsers.forEach((user, id) => {
      user.positions.forEach(remoteCursor => {
        var remoteRange = remoteCursor.range;
        var isSelection = !remoteCursor.range.isEmpty();
        if (remoteCursor.rtl)
          var cursorPosition = remoteRange.getStartPosition();
        else
          var cursorPosition = remoteRange.getEndPosition();
        var cursorRange = Range.fromPositions(cursorPosition, cursorPosition);
        var cursorColor = `editor-${user.color}`;
        var cursorBetween = cursorPosition.column == 1 ? '' : 'editor-cursor-between';
        
        if (isSelection) { // Selection decoration
          newDecorations.push({
            range: remoteRange,
            options: {
              isWholeLine: false,
              className: `${cursorColor} editor-selection`,
              stickiness: 1
            }
          });
        }
        newDecorations.push({ // Cursor decoration
          range: cursorRange,
          options: {
            isWholeLine: false,
            className: `${cursorColor} editor-cursor ${cursorBetween}`,
            hoverMessage: { value: user.name },
            stickiness: 1
          }
        });
        newDecorations.push({ // Cursor top box decoration
          range: cursorRange,
          options: {
            isWholeLine: false,
            className: `${cursorColor} editor-top`,
            stickiness: 1
          }
        });
      });
    });
    console.log(this.decorations, newDecorations);
    this.decorations = this.editor.deltaDecorations(this.decorations, newDecorations);
  }

  newUserData(name: string): RemoteUserData {
    var user: RemoteUserData = {
      positions: [],
      color: this.colors[(this.newColorIndex++) % this.colors.length],
      name: name
    }
    return user;
  }

  mapToSelectionsDTO(selections: CursorSelection[]) {
    var selectionsDTO = selections.map(selection => {
      var selectionDTO: any = this.mapToRangeDTO(selection);
      if (selection.getDirection() == monaco.SelectionDirection.RTL)
        selectionDTO.r = true
      return selectionDTO;
    });
    return selectionsDTO;
  }

  mapToRangeDTO(range: IRange) {
    return { 
      sL: range.startLineNumber, sC: range.startColumn,
      eL: range.endLineNumber, eC: range.endColumn
    };
  }

  mapFromRangeDTO(rangeDTO: any): Range {
    return new Range(rangeDTO.sL, rangeDTO.sC,rangeDTO.eL, rangeDTO.eC);
  }
}

// Monaco Type and Class Aliases 
import CursorChangeReason = monaco.editor.CursorChangeReason;
import Position = monaco.Position;
import Range = monaco.Range;
import CursorSelection = monaco.Selection;
// export { CursorChangeReason, Position, Range, CursorSelection };
export type IRange = monaco.IRange;
export type Editor = monaco.editor.ICodeEditor;
export type Change =  monaco.editor.ISingleEditOperation;
export type ChangeEvent = Array<Change>; // Multiple locations can be changed at once
export type EditorOptions = monaco.editor.IStandaloneEditorConstructionOptions;
export type EditorViewState = monaco.editor.ICodeEditorViewState;

export interface RemoteUserData {
  name: string;
  color: string; // color in UI and editor
  positions: Array<{ // cursor positions
    range: Range; 
    rtl: boolean;
  }>; 
}