// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Workspace } from '../api/gen/models';
import { BehaviorSubject, Observable, of, Subject, Subscription, timer } from 'rxjs';
import { DocumentService } from '../api/document.service';
import { auditTime, buffer, catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { faCloudUploadAlt, faImages, faFileImage, faSpinner, faLock } from '@fortawesome/free-solid-svg-icons';
import * as monaco from 'monaco-editor';
import { NotificationService, HubEvent, Actor, HubState } from '../notification.service';
import { ChangeEvent, CollaborationService, CursorChangeReason, CursorSelection, Editor, EditorOptions, EditorViewState, ForwardChangeEvent, Position, UserTimeMap } from '../collaboration.service';
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

  readOnly: boolean = true; // Initially locked until loaded

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
  private editorFocused: boolean = true;
  private decorations: string[] = [];
  private tooltipMessage?: any;
  private colors = ['green', 'purple ', 'pride-yellow', 'magenta', 'sienna', 'darkolive',  'cyan', 'red', 'brown', 'seagreen ', 'pink', 'pride-red', 'pride-orange', 'teal'];
  private newColorIndex = 0;
  private remoteUsers = new Map<string, RemoteUserData>();
  // Collaboration information
  private beginTypingPositions: Array<Position> = [];
  private beginTypingTime?: number;
  private userTimestamps: UserTimeMap = {};
  private timeLastSaved: number = 0;
  private selections$ = new BehaviorSubject<CursorSelection[]>([]);
  private edits$ = new Subject<ForwardChangeEvent>();
  private contentChanging = false;
  private contentMonitor: any;
  private currentlyEditing = false;
  private editingMonitor: any;
  private cursorMonitor: any;
  private lockMonitor: any;
  private applyingRemoteEdits: boolean = false;
  private selectionSub: Subscription;
  private documentSub: Subscription;
  private presenceSub: Subscription;
  private editsSub: Subscription;
  private stateSub: Subscription;
  
  constructor(
    private api: DocumentService,
    private hub: NotificationService,
    private collab: CollaborationService
  ) {
    this.editorModel$ = this.docid$.pipe(
      tap(() => this.resetEditorInfo()),
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
      debounceTime(4000),
      filter(() => !this.readOnly),
      switchMap(() => api.updateDocument(this.summary.globalId, this.doctext)),
      mergeMap(() => timer(0, 6000).pipe(
        map(i => !(i % 2)),
        take(2)
      ))
    );

    this.stateSub = this.hub.state$.pipe(
      tap((state: HubState) => {
        state.actors.forEach((actor: Actor) => {
          if (!actor.online) // remove cursors for offline user
            this.updateRemotePositions(actor, []);
        }); 
      }),
      map((state) => state.id),
      distinctUntilChanged() 
    ).subscribe(() => { // lock editor when doc ID changes
      this.readOnly = true;
      this.editor?.updateOptions({ readOnly: true });
    });

    this.documentSub = this.hub.documentEvents.subscribe(
      (event: HubEvent) => {
        console.log(event);
        if (event.action === 'DOCUMENT.CURSOR') { 
          this.updateRemotePositions(event.actor, event.model);
        } else if (event.action === 'DOCUMENT.UPDATED') {
          const model: ForwardChangeEvent[] = this.collab.mapFromForwardChangesDTO(event.model);
          const shortActorId = this.collab.shortenId(event.actor.id);
          this.applyRemoteEdits(model, shortActorId);
          if (this.readOnly)
            this.startLockMonitor();
          this.contentChanged();
        } else if (event.action === 'DOCUMENT.SAVED') { 
          var timestamp = +event.model.timestamp;
          // If incoming saved copy is newest version so far
          if (this.timeLastSaved < timestamp) {
            this.timeLastSaved = timestamp;
            // Syncrhonize entire document from server copy when needed & not being edited
            if (this.readOnly || (!this.contentChanging && 
                (this.doctext.length != event.model.text.length || this.doctext != event.model.text))) {
              this.doctext = event.model.text; 
              this.editor?.setValue(this.doctext);
            }
          }
        }
      }
    );

    this.selectionSub = this.selections$.pipe(
      auditTime(1000), // Not that important, don't send updates as frequently
      map((selections) => this.collab.mapToSelectionsDTO(selections))
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

    this.editsSub = this.edits$.pipe(
      filter(() => !this.readOnly),
      buffer(this.edits$.pipe(auditTime(600))),
      map((edits: ForwardChangeEvent[]) => this.collab.mapToForwardChangesDTO(edits)),
      filter(() => !this.readOnly),
    ).subscribe(
      (edits: any[]) => {
        console.log(edits);
        this.hub.edited(edits);
      }
    );

    this.forwardCursorSelections();
  }

  ngOnInit(): void {
  }
  
  ngOnDestroy(): void {
    this.hub.cursorChanged([]);
    this.documentSub.unsubscribe();
    this.presenceSub.unsubscribe();
    this.selectionSub.unsubscribe();
    this.editsSub.unsubscribe();
    this.stateSub.unsubscribe();
  }

  ngAfterViewInit(): void {
    // initial "change" happens before subscription, so fire here after subscribed
    this.docid$.next(this.summary.globalId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.docid$.next(changes.summary.currentValue.globalId);
  }

  resetEditorInfo() {
    this.readOnly = true
    this.editorViewState = undefined;
    this.forwardCursorSelections();
    this.remoteUsers.clear();
    this.newColorIndex = 0;
    this.collab.appliedEditsLog = [];
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
  
  editorInit(editor: Editor): void {
    this.editor = editor;
    if (this.editorViewState)
      this.restoreEditorViewState();
    else
      this.saveEditorViewState();
    editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF); // must be consistent across browsers
    this.collab.editorEol = this.editor?.getModel()?.getEOL()!;
    this.tooltipMessage = this.editor?.getContribution('editor.contrib.messageController');
    this.decorations = [];
    this.applyDecorations();
    editor.onDidChangeCursorPosition((event) => this.editorViewChanged(event.reason) );
    editor.onDidChangeCursorSelection((event) => this.changedCursorSelections(event) );
    editor.onDidScrollChange(() => this.editorViewChanged() );
    editor.onDidFocusEditorWidget(() => this.editorFocused = true );
    editor.onDidBlurEditorWidget(() => this.editorFocused = false );
    editor.onDidAttemptReadOnlyEdit(() => {
      this.tooltipMessage?.showMessage('Loading document...', this.editor.getPosition());
    });
    editor.onDidChangeModelContent((event: monaco.editor.IModelContentChangedEvent) => {
      this.doctext = this.editor.getValue();
      if (event.isFlush || this.applyingRemoteEdits) // Only respond to local user changes
        return;
      this.dirty$.next(true);
      this.forwardContentChange(event);
    });
    if (this.readOnly) 
      this.startLockMonitor(); // once editor intializes, begin unlocking
  }

  private saveEditorViewState() {
    this.editorViewState = this.editor?.saveViewState() ?? undefined;
  }
  
  private restoreEditorViewState() {
    this.editor?.restoreViewState(this.editorViewState!);
    if (this.editorFocused)
      this.editor?.focus();
    this.tooltipMessage = this.editor.getContribution('editor.contrib.messageController');
  }
  
  private editorViewChanged(reason?: CursorChangeReason) {
    if (reason && reason == CursorChangeReason.ContentFlush)
      this.restoreEditorViewState();
    else
      this.saveEditorViewState();
  }

  private changedCursorSelections(event: monaco.editor.ICursorSelectionChangedEvent) {
    this.editorViewChanged(event.reason);
    if (event.reason == CursorChangeReason.ContentFlush)
      return;
    const selections = [event.selection, ...event.secondarySelections]
    this.forwardCursorSelections(selections);
    if (event.reason == CursorChangeReason.NotSet && event.source == 'keyboard')
      return;
    if (!this.applyingRemoteEdits)
      this.storeBeginPositions(selections);
  }

  private forwardCursorSelections(selections?: Array<CursorSelection>) {
    if (selections == null || selections.length == 0) {
      this.selections$.next([new CursorSelection(1, 1, 1, 1)]);
      return;
    }
    this.selections$.next(selections);
  }

  private updateRemotePositions(actor: Actor, selections: any[]) {
    if (this.remoteUsers.has(actor.id)) {
      var user = this.remoteUsers.get(actor.id)!;
    } else {
      var user = this.newUserData(actor.name);
      this.remoteUsers.set(actor.id, user);
    }
    // Could apply transformations here, but probably not worth the computation
    user.positions = selections.map((selection) => {
      return {range: this.collab.mapFromRangeDTO(selection),
              rtl: selection.r ?? false}
    })
    this.applyDecorations();
  }

  private applyDecorations() {
    if (!this.editor)
      return;
    var newDecorations: any[] = [];
    this.remoteUsers.forEach((user, info) => {
      user.positions.forEach(cursor => {
        var range = cursor.range;
        var isSelection = !cursor.range.isEmpty();
        var cursorPosition = cursor.rtl ? range.getStartPosition() : range.getEndPosition();
        var cursorRange = Range.fromPositions(cursorPosition, cursorPosition);
        var color = `editor-${user.color}`;
        var cursorBetween = cursorPosition.column == 1 ? '' : 'editor-cursor-between';
        const decor = { isWholeLine: false, stickiness: 1 }
        if (isSelection) { // Selection decoration
          newDecorations.push({
            range: range,
            options: { ...decor, className: `${color} editor-selection` }
          });
        }
        newDecorations.push({ // Cursor decoration
          range: cursorRange,
          options: { ...decor, 
            className: `${color} editor-cursor ${cursorBetween}`,
            hoverMessage: { value: user.name }
          }
        });
        newDecorations.push({ // Cursor top box decoration
          range: cursorRange,
          options: { ...decor, className: `${color} editor-top` }
        });
      });
    });
    this.decorations = this.editor.deltaDecorations(this.decorations, newDecorations);
  }

  private newUserData(name: string): RemoteUserData {
    var user: RemoteUserData = {
      positions: [],
      color: this.colors[(this.newColorIndex++) % this.colors.length],
      name: name
    }
    return user;
  }

  private storeBeginPositions(selections?: Array<monaco.Selection>) {
    if (selections == null)
      return;
    var sortedPositions = selections.map(s => s.getStartPosition()).sort((a,b) =>  -Position.compare(a, b) );
    this.beginTypingPositions = sortedPositions;
    if (this.currentlyEditing)
      this.beginTypingTime = this.collab.generateTimestamp();
  }

  private editing(timestamp: number) {
    this.contentChanged();
    if (!this.beginTypingTime)
      this.beginTypingTime = timestamp;
    this.currentlyEditing = true;
    clearTimeout(this.editingMonitor);
    this.editingMonitor = setTimeout(() => {
      this.currentlyEditing = false;
      this.storeBeginPositions(this.editor?.getSelections() ?? undefined);
      this.beginTypingTime = undefined;
    }, 3000);
  }

  private forwardContentChange(event: monaco.editor.IModelContentChangedEvent) {
    const timestamp = this.collab.generateTimestamp();
    this.editing(timestamp);
    const changeEvent: ForwardChangeEvent = {
      changes: event.changes,
      timestamp: timestamp,
      userTimestamps: {...this.userTimestamps},
      beginPositions: this.beginTypingPositions.length == event.changes.length ? [...this.beginTypingPositions] : [],
      beginTime: this.beginTypingTime!
    };
    this.collab.storeTransformationLog([changeEvent], this.collab.shortenId(this.hub.me));
    this.edits$.next(changeEvent);
    // Send final cursor state after all editing is done for accurate position
    clearTimeout(this.cursorMonitor);
    this.cursorMonitor = setTimeout(() => {
      this.forwardCursorSelections(this.editor?.getSelections() ?? []);
    }, 1500);
  }

  private applyRemoteEdits(changeModel: ForwardChangeEvent[], uid: string) {
    this.applyingRemoteEdits = true;
    var allTransformedChanges: Array<ForwardChangeEvent> = [];
    var tracker = {start: 0, set: false};
    var latestTimestamp = 0;
    changeModel.forEach(changeEvent => {
      var transformedChanges = this.collab.applyTransformations(changeEvent, uid, tracker);
      var position = this.editor?.getPosition() || undefined;
      var shouldPreserveCursor = this.shouldPreserveCursor(transformedChanges, position);
      // TODO: can use returned undo operations to store/modify so undo stack works with remote editors
      this.editor?.getModel()?.applyEdits(transformedChanges); 
      allTransformedChanges.push({
        changes: transformedChanges,
        timestamp: changeEvent.timestamp,
        userTimestamps: changeEvent.userTimestamps,
        beginPositions: changeEvent.beginPositions,
        beginTime: changeEvent.beginTime
      });
      latestTimestamp = changeEvent.timestamp;
      if (position && shouldPreserveCursor)
        this.editor?.setPosition(position);
    });
    this.applyingRemoteEdits = false;
    this.collab.storeTransformationLog(allTransformedChanges, uid);
    this.userTimestamps[uid] = latestTimestamp;
  }

  /* For simple edits and selections, don't let remote users move cursor when at same position */
  private shouldPreserveCursor(changes: ChangeEvent, position?: Position) {
    var selections = this.editor?.getSelections() ?? [];
    return (changes.length == 1 && selections.length == 1 && position &&
        selections[0].startLineNumber == selections[0].endLineNumber &&
        selections[0].startColumn == selections[0].endColumn &&
        changes[0].range.startLineNumber == position.lineNumber &&
        changes[0].range.startColumn == position.column);
  }

  private startLockMonitor() {
    clearTimeout(this.lockMonitor);
    this.lockMonitor = setTimeout(() => {
      this.readOnly = false;
      this.editor.updateOptions({ readOnly: false });
    }, 6000);
  }

  private contentChanged() {
    this.contentChanging = true;
    clearTimeout(this.contentMonitor);
    this.contentMonitor = setTimeout(() => {
      this.contentChanging = false;
    }, 3000);
  }
}