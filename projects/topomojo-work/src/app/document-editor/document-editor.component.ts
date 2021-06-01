// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Workspace } from '../api/gen/models';
import { BehaviorSubject, interval, merge, Observable, of, Subject, Subscription, timer } from 'rxjs';
import { DocumentService } from '../api/document.service';
import { auditTime, buffer, catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { faCloudUploadAlt, faImages, faFileImage, faSpinner, faLock } from '@fortawesome/free-solid-svg-icons';
import * as monaco from 'monaco-editor';
import { NotificationService, HubEvent, Actor, HubState } from '../notification.service';
import { CollaborationService, CursorChangeReason, CursorSelection,
  Editor, EditorOptions, EditorViewState, DocumentChange, Position, UserTimeMap, EditorChange, DocumentChangeDTO } from '../collaboration.service';
import { RemoteUserData, Range } from '../collaboration.service';

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
  faSpinner = faSpinner;
  faLock = faLock;

  readOnly = true; // Initially locked until loaded

  private editor!: Editor;
  editorOptions: EditorOptions = {
    // theme: 'vs-dark',
    minimap: { enabled: false },
    lineNumbers: 'off',
    quickSuggestions: false,
    readOnly: true, // always start readOnly until all loaded
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    linkedEditing: true,
    fixedOverflowWidgets: true
  };
  private editorViewState?: EditorViewState;
  private editorFocused = true;
  private decorations: string[] = [];
  private tooltipMessage?: any;
  private remoteUsers = new Map<string, RemoteUserData>();

  // Collaboration information
  private beginTypingPositions: Array<Position> = [];
  private beginTypingTime?: number;
  private userTimestamps: UserTimeMap = {};
  private timeLastSaved = 0;
  private selections$ = new BehaviorSubject<CursorSelection[]>([new CursorSelection(1, 1, 1, 1)]);
  private edits$ = new Subject<DocumentChange>();
  private editorWriteable$ = new Subject<boolean>();
  private editing = false;
  private applyingRemoteEdits = false;
  private subs: Subscription[] = [];

  constructor(
    private api: DocumentService,
    private hub: NotificationService,
    private collab: CollaborationService
  ) {

    this.editorModel$ = this.docid$.pipe(
      debounceTime(500),
      filter(id => !!id),
      switchMap(id => this.api.getDocument(id).pipe(
        catchError(err => of(''))
        )),
      tap(() => this.resetEditorInfo()),
      tap(text => this.doctext = text),
      map(text => ({
        value: text,
        language: 'markdown'
      }) as NgxEditorModel)
    );

    this.saved$ = this.dirty$.pipe(
      debounceTime(4000),
      filter(() => !this.readOnly),
      switchMap(() => api.updateDocument(this.summary.globalId, this.doctext)),
      mergeMap(() => timer(0, 4000).pipe(
        map(i => !(i % 2)),
        take(2)
      ))
    );

    this.subs.push(

      // remove offline actor cursors
      this.hub.state$.pipe(
        mergeMap(s => s.actors),
        filter(a => !a.online)
      ).subscribe(a =>
        this.updateRemotePositions(a, [])
      ),

      this.hub.documentEvents.subscribe(
        (event: HubEvent) => {

          // console.log(event);

          if (event.action === 'DOCUMENT.CURSOR') {

            this.updateRemotePositions(event.actor, event.model);

          } else if (event.action === 'DOCUMENT.UPDATED') {

            this.applyRemoteEdits(
              this.collab.toDocumentChanges(event.model),
              event.actor.id
            );

            this.editorWriteable$.next(true);

          } else if (event.action === 'DOCUMENT.SAVED') {

            this.tryApplySaved(event.model);

          }
        }
      ),

      this.hub.presenceEvents.subscribe(
        (event: HubEvent) => {
          if (event.action === 'PRESENCE.ARRIVED' || event.action === 'PRESENCE.GREETED') {
            this.emitCursorSelections(this.selections$.value);
          }
        }
      ),

      this.selections$.pipe(
        auditTime(1000), // Not that important, don't send updates as frequently
        map((s) => this.collab.toSelectionsDTO(s))
      ).subscribe(s =>
        this.hub.cursorChanged(s)
      ),

      this.edits$.pipe(
        // tap(c => console.log(c)),
        tap(c => this.startEdit(c.timestamp)),
        tap(c => c.beginTime = this.beginTypingTime || c.timestamp),
        tap(c => this.collab.storeTransformationLog([c], this.hub.me)),
        buffer(interval(500)),
        filter(b => b.length > 0),
        map((edits: DocumentChange[]) => this.collab.toDocumentChangesDTO(edits)),
        tap(() => this.dirty$.next(true)),
        // tap(c => console.log(c)),
        tap(c => this.hub.edited(c)),
        debounceTime(3000),
        tap(() => this.stopEdit())
      ).subscribe(),

      this.editorWriteable$.pipe(
        debounceTime(5000)
      ).subscribe(() => {
        this.readOnly = false;
        this.editor.updateOptions({ readOnly: false });
      })
    );

    this.emitCursorSelections();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.hub.cursorChanged([]);
    this.subs.forEach(s => s.unsubscribe());
  }

  ngAfterViewInit(): void {
    // initial "change" happens before subscription, so fire here after subscribed
    this.docid$.next(this.summary.globalId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.docid$.next(changes.summary.currentValue.globalId);
  }

  insertImage(text: string): void {
    text = `\n${text}\n\n`;
    const range = this.editor.getSelection() || new monaco.Selection(1, 1, 1, 1);
    this.editor.executeEdits('image-manager', [{range, text, forceMoveMarkers: true}], );
    this.editor.focus();
  }

  editorInit(editor: Editor): void {
    this.editor = editor;
    if (this.editorViewState) {
      this.restoreEditorViewState();
    }
    else {
      this.saveEditorViewState();
    }
    editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF); // must be consistent across browsers
    this.collab.editorEol = this.editor.getModel()?.getEOL() || '\n';
    this.tooltipMessage = this.editor?.getContribution('editor.contrib.messageController');

    editor.onDidChangeCursorPosition((event) => this.editorViewChanged(event.reason) );
    editor.onDidChangeCursorSelection((event) => this.cursorSelectionChanged(event) );
    editor.onDidScrollChange(() => this.editorViewChanged() );
    editor.onDidFocusEditorWidget(() => this.editorFocused = true );
    editor.onDidBlurEditorWidget(() => this.editorFocused = false );
    editor.onDidAttemptReadOnlyEdit(() =>
      this.tooltipMessage?.showMessage(
        'Loading document...',
        this.editor.getPosition()
      )
    );
    editor.onDidChangeModelContent((event: monaco.editor.IModelContentChangedEvent) => {

      // set local doc text
      this.doctext = this.editor.getValue();

      // Only respond to local edits
      if (event.isFlush || this.applyingRemoteEdits) {
        return;
      }

      // this.emitLocalChange(event);
      this.edits$.next({
        changes: event.changes,
        timestamp: Date.now(),
        userTimestamps: {...this.userTimestamps},
        beginPositions: this.beginTypingPositions.length === event.changes.length
          ? [...this.beginTypingPositions]
          : [],
        beginTime: this.beginTypingTime || 0
      } as DocumentChange);

    });

    this.decorations = [];
    this.applyDecorations();

    // make readonly editor writeable
    this.editorWriteable$.next(true);
  }

  private saveEditorViewState(): void {
    this.editorViewState = this.editor?.saveViewState() ?? undefined;
  }

  private restoreEditorViewState(): void {
    if (!this.editorViewState) { return; }
    this.editor.restoreViewState(this.editorViewState);
    if (this.editorFocused) {
      this.editor?.focus();
    }
    this.tooltipMessage = this.editor.getContribution('editor.contrib.messageController');
  }

  private editorViewChanged(reason?: CursorChangeReason): void {
    if (reason && reason === CursorChangeReason.ContentFlush) {
      this.restoreEditorViewState();
    }
    else {
      this.saveEditorViewState();
    }
  }

  private resetEditorInfo(): void {
    this.readOnly = true;
    this.editor?.updateOptions({ readOnly: true });
    this.editorViewState = undefined;
    this.emitCursorSelections();
    this.remoteUsers.clear();
    this.collab.appliedEditsLog = [];
  }

  private tryApplySaved(model: any): void {
    if (model.timestamp <= this.timeLastSaved) { return; }

    this.timeLastSaved = model.timestamp;

    if (this.editing) { return; }

    const diff =
    this.doctext.length !== model.text.length ||
    this.doctext !== model.text;

    if (!diff) { return; }

    this.doctext = model.text;
    this.editor?.setValue(this.doctext);
  }

  private cursorSelectionChanged(event: monaco.editor.ICursorSelectionChangedEvent): void {

    this.editorViewChanged(event.reason);

    if (event.reason === CursorChangeReason.ContentFlush) {
      return;
    }

    const selections = [event.selection, ...event.secondarySelections];

    this.emitCursorSelections(selections);

    if (event.reason === CursorChangeReason.NotSet &&
        event.source === 'keyboard'
     ) {
      return;
    }

    if (this.applyingRemoteEdits) { return; }

    this.storeBeginPositions(selections);
  }

  private emitCursorSelections(selections?: monaco.Selection[]): void {
    this.selections$.next(
      selections || [ new CursorSelection(1, 1, 1, 1) ]
    );
  }

  private updateRemotePositions(actor: Actor, selections: any[]): void {

    const user = this.remoteUsers.get(actor.id) || {
      name: actor.name,
      color: actor.color, // this.colors[(this.newColorIndex++) % this.colors.length],
      positions: []
    };

    if (!this.remoteUsers.has(actor.id)) {
      this.remoteUsers.set(actor.id, user);
    }

    // Could apply transformations here, but probably not worth the computation
    user.positions = selections.map((selection) => ({
      range: this.collab.toRange(selection),
      rtl: selection.r ?? false
    }));

    this.applyDecorations();
  }

  private applyDecorations(): void {
    if (!this.editor) { return; }

    const newDecorations: any[] = [];
    this.remoteUsers.forEach((user, info) => {
      user.positions.forEach(cursor => {
        const range = cursor.range;
        const isSelection = !cursor.range.isEmpty();
        const cursorPosition = cursor.rtl ? range.getStartPosition() : range.getEndPosition();
        const cursorRange = Range.fromPositions(cursorPosition, cursorPosition);
        const cursorBetween = cursorPosition.column === 1 ? '' : 'editor-cursor-between';
        const decor = { isWholeLine: false, stickiness: 1 };
        if (isSelection) { // Selection decoration
          newDecorations.push({
            range,
            options: { ...decor, className: `bg-${user.color} editor-selection` }
          });
        }
        newDecorations.push({ // Cursor decoration
          range: cursorRange,
          options: { ...decor,
            className: `bg-${user.color} editor-cursor ${cursorBetween}`,
            hoverMessage: { value: user.name }
          }
        });
        newDecorations.push({ // Cursor top box decoration
          range: cursorRange,
          options: { ...decor, className: `bg-${user.color} editor-top` }
        });
      });
    });

    this.decorations = this.editor?.deltaDecorations(this.decorations, newDecorations) || [];
  }

  private storeBeginPositions(selections?: monaco.Selection[]): void {

    this.beginTypingPositions = selections?.map(s => s.getStartPosition())
      .sort((a, b) =>  -Position.compare(a, b) ) ?? [];

  }

  private startEdit(timestamp: number): void {
    // this.contentChanged();
    this.editing = true;
    if (!this.beginTypingTime) {
      this.beginTypingTime = timestamp;
    }
  }

  private stopEdit(): void {
    this.editing = false;
    this.beginTypingTime = undefined;
    this.storeBeginPositions(this.selections$.value);
    // this.storeBeginPositions(this.editor?.getSelections() ?? undefined);
    this.emitCursorSelections(this.selections$.value);
  }

  private applyRemoteEdits(changeModel: DocumentChange[], uid: string): void {

    this.applyingRemoteEdits = true;

    const tracker = {start: 0, set: false};

    let latestTimestamp = 0;

    changeModel.forEach((dc: DocumentChange) => {
      dc.changes = this.collab.applyTransformations(dc, uid, tracker);
      const position = this.editor.getPosition();
      const shouldPreserveCursor = this.shouldPreserveCursor(dc.changes, position);

      // TODO: can use returned undo operations to store/modify so undo stack works with remote editors
      this.editor?.getModel()?.applyEdits(dc.changes);

      if (position && shouldPreserveCursor) {
        this.editor?.setPosition(position);
      }

      latestTimestamp = dc.timestamp;
    });
    this.collab.storeTransformationLog(changeModel.flat(), uid);
    this.applyingRemoteEdits = false;
    this.userTimestamps[uid.substr(0, 8)] = latestTimestamp;
    // console.log(this.userTimestamps);
  }

  /* For simple edits and selections, don't let remote users move cursor when at same position */
  private shouldPreserveCursor(changes: EditorChange[], position: Position | null): boolean | null {
    const selections = this.editor?.getSelections() ?? [];
    return (changes.length === 1 && selections.length === 1 && position &&
      selections[0].startLineNumber === selections[0].endLineNumber &&
      selections[0].startColumn === selections[0].endColumn &&
      changes[0].range.startLineNumber === position.lineNumber &&
      changes[0].range.startColumn === position.column);
  }

}
