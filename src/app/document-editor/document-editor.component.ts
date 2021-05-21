// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Workspace } from '../api/gen/models';
import { BehaviorSubject, fromEvent, interval, Observable, of, Subject, Subscription } from 'rxjs';
import { DocumentService } from '../api/document.service';
import { auditTime, buffer, catchError, debounceTime, distinctUntilChanged, filter, map, mergeMap, reduce, switchMap, take, tap } from 'rxjs/operators';
import { NgxEditorModel } from 'ngx-monaco-editor';
import { faCloudUploadAlt, faImages, faFileImage, faSpinner, faLock } from '@fortawesome/free-solid-svg-icons';
import * as monaco from 'monaco-editor';
import { NotificationService, HubEvent, Actor, HubState } from '../notification.service';
import { AppliedEdit, ChangeEvent, CollaborationService, CursorChangeReason, CursorSelection, DocumentEdits, Editor, EditorViewState, ForwardChangeEvent, IRange, Position, TimedChangeEvent, UserTimeMap } from '../collaboration.service';
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

  private editorEol: string = '\n';

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
  private editsSub: Subscription;
  private stateSub: Subscription;

  private edits$ = new Subject<ForwardChangeEvent>();

  private applyingRemoteEdits: boolean = false;

  readOnly: boolean = true; // Initially locked until loaded
  lockMonitor: any;

  private tooltipMessage?: any;

  lastServerVersion: number = 0;

  uid = null;

  appliedEditsLog: any[] = [];

  editorOptions: monaco.editor.IEditorOptions = {
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

  private editor!: monaco.editor.ICodeEditor;

  // from old
  private userTimestamps: UserTimeMap = {};
  private beginTypingPositions: Array<Position> = [];
  private beginTypingTime?: number;
  private editingMonitor: any;
  private currentlyEditing: boolean = false;
  private cursorMonitor: any;

  constructor(
    private api: DocumentService,
    private hub: NotificationService,
    private collab: CollaborationService
  ) {
    console.log({t:"constructor", r: this.readOnly});
    this.editorModel$ = this.docid$.pipe(
      tap(() => console.log({t:"top docid pipe"})),
      tap(() => this.resetEditorInfo()),
      tap(() => this.readOnly = true),
      debounceTime(500),
      filter(id => !!id),
      switchMap(id => this.api.getDocument(id).pipe(
        catchError(err => of(''))
      )),
      tap(text => this.doctext = text),
      tap(() => console.log({t:"near end docid pipe"})),
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
      ))
    );

    this.stateSub = this.hub.state$.pipe(
      tap((state: HubState) => {
        state.actors.forEach((actor: Actor) => {
          if (!actor.online) 
            this.updateRemotePositions(actor, []);
        }); 
      }),
      map((state) => state.id),
      distinctUntilChanged() // lock document when id changes
    )
    .subscribe(() => {
      this.readOnly = true;
      this.editor?.updateOptions({ readOnly: true });
    });

    this.documentSub = this.hub.documentEvents.subscribe(
      (event: HubEvent) => {
        console.log(event);
        if (event.action === 'DOCUMENT.CURSOR') { 
          this.updateRemotePositions(event.actor, event.model);
        } else if (event.action === 'DOCUMENT.UPDATED') {
          // const model: DocumentEdits = this.collab.mapFromDocumentEditsDTO(event.model);
          const model: ForwardChangeEvent[] = event.model;
          const shortActorId = this.shortenId(event.actor.id);
          this.applyRemoteEdits(model, shortActorId);
          if (this.readOnly)
            this.startLockMonitor();
        }
      }
    );

    this.selectionSub = this.selections$.pipe(
      filter(() => true),
      auditTime(1000), // Not that important, don't send updates as frequently
      map((selections) => this.collab.mapToSelectionsDTO(selections))
    ).subscribe(
      (selections) => {
        this.hub.cursorChanged(selections);
      }
    );

    this.presenceSub = this.hub.presenceEvents.subscribe(
      (event: HubEvent) => {
        // console.log(event);
        if (event.action === 'PRESENCE.ARRIVED' || event.action === 'PRESENCE.GREETED') {
          // console.log("GREETED OR ARRIVED");
          this.forwardCursorSelections(this.selections$.value);
        }
      }
    );

    this.editsSub = this.edits$.pipe(
      filter(() => !this.readOnly),
      buffer(this.edits$.pipe(auditTime(600)))
    ).subscribe(
      (edits: ForwardChangeEvent[]) => {
        console.log(edits);
        this.hub.edited(edits);
      }
    );

    this.forwardCursorSelections();

  }

  ngOnInit(): void {
    // alert("init");
    console.log({t:"ngOnInit"});
  }
  
  ngOnDestroy(): void {
    // this.hub.cursorChanged([]);

    this.documentSub.unsubscribe();
    this.presenceSub.unsubscribe();
    this.selectionSub.unsubscribe();
    // this.editsSub.unsubscribe();
    this.stateSub.unsubscribe();
    // alert("destroy");
  }

  ngAfterViewInit(): void {
    // initial "change" happens before subscription, so fire here after subscribed
    this.docid$.next(this.summary.globalId);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.docid$.next(changes.summary.currentValue.globalId);
  }

  resetEditorInfo() {
    this.editorViewState = undefined;
    this.forwardCursorSelections();
    this.remoteUsers.clear();
    this.newColorIndex = 0;
    this.appliedEditsLog = [];
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

  startLockMonitor() {
    clearTimeout(this.lockMonitor);
    this.lockMonitor = setTimeout(() => {
      this.readOnly = false;
      this.editor.updateOptions({ readOnly: false });
    }, 4000);
  }
  

  editorInit(editor: Editor): void {
    // console.log({t:"editorInit"});
    this.editor = editor;
    if (this.editorViewState)
      this.restoreEditorViewState();
    else
      this.saveEditorViewState();
    editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF); // must be consistent across browsers
    this.editorEol = this.editor?.getModel()?.getEOL()!;
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
      // var newEdit: Edit = {change: event.changes, version:this.lastServerVersion};
      // this.edits$.next(newEdit);
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
    console.log("editor view ", reason);
    if (reason && reason == CursorChangeReason.ContentFlush)
      this.restoreEditorViewState();
    else
      this.saveEditorViewState();
  }

  changedCursorSelections(event: monaco.editor.ICursorSelectionChangedEvent) {
    console.log("cursor ", event.reason);
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

  forwardCursorSelections(selections?: Array<CursorSelection>) {
    if (selections == null || selections.length == 0) {
      this.selections$.next([new CursorSelection(1, 1, 1, 1)]);
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
    // Could apply transformations here, but probably not worth the computation
    user.positions = selections.map((selection) => {
      return {range: this.collab.mapFromRangeDTO(selection),
              rtl: selection.r ?? false}
    })
    this.applyDecorations();
  }

  applyDecorations() {
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

  newUserData(name: string): RemoteUserData {
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
      this.beginTypingTime = this.generateTimestamp();
  }

  editing(timestamp: number) {
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
    const timestamp = this.generateTimestamp();
    this.editing(timestamp);
    const changeEvent: ForwardChangeEvent = {
      changes: event.changes,
      timestamp: timestamp,
      userTimestamps: {...this.userTimestamps},
      beginPositions: this.beginTypingPositions.length == event.changes.length ? [...this.beginTypingPositions] : [],
      beginTime: this.beginTypingTime!
    };
    this.storeTransformationLog([changeEvent], this.shortenId(this.hub.me));
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
      var transformedChanges = this.applyTransformations(changeEvent, uid, tracker);
      var position = this.editor.getPosition()!;
      var shouldPreserveCursor = this.shouldPreserveCursor(transformedChanges, position);
      // TODO: can use returned undo operations to store/modify so undo stack works with remote editors
      this.editor.getModel()?.applyEdits(transformedChanges); 
      allTransformedChanges.push({
        changes: transformedChanges,
        timestamp: changeEvent.timestamp,
        userTimestamps: changeEvent.userTimestamps,
        beginPositions: changeEvent.beginPositions,
        beginTime: changeEvent.beginTime
      });
      latestTimestamp = changeEvent.timestamp;
      if (shouldPreserveCursor)
        this.editor.setPosition(position);
    });
    this.applyingRemoteEdits = false;
    this.storeTransformationLog(allTransformedChanges, uid);
    this.userTimestamps[uid] = latestTimestamp;
  }

  /* For simple edits and selections, don't let remote users move cursor when at same position */
  private shouldPreserveCursor(changes: ChangeEvent, position: Position) {
    var selections = this.editor.getSelections() ?? [];
    return (changes.length == 1 && selections.length == 1 &&
        selections[0].startLineNumber == selections[0].endLineNumber &&
        selections[0].startColumn == selections[0].endColumn &&
        changes[0].range.startLineNumber == position.lineNumber &&
        changes[0].range.startColumn == position.column);
  }
  
  /* Store any applied edits as a log to apply transformations on future incoming operations */
  private storeTransformationLog(edits: Array<ForwardChangeEvent>, uid: string) {
    var newLog = this.pruneTransformations();
    edits.forEach(changeEvent => {
      var newEdits: AppliedEdit[] = [];
      changeEvent.changes.forEach((change, index) => {
        var selectionHeight = change.range.endLineNumber - change.range.startLineNumber;
        var lines = change.text?.split(this.editorEol) ?? [""];
        var newLinesAdded = lines.length - 1;
        var newColsAdded = lines[lines.length - 1].length;
        var lineDelta = newLinesAdded - selectionHeight;
        var appliedEdit = {
          uid: uid,
          timestamp: changeEvent.timestamp,
          lineDelta: lineDelta,
          beginPosition: changeEvent.beginPositions[index] ?? null,
          range: this.createRange(change.range),
          newLines: newLinesAdded,
          bottomLineLength: newColsAdded,
          beginTime: changeEvent.beginTime
        };
        newEdits.push(appliedEdit);
      });
      newLog = this.insertIntoSorted(newLog, newEdits);
    });
    this.appliedEditsLog = newLog;
  }

  /* Go through all applied edits, filtering by user and timestamp, and transform 
    the range/position of incoming changes with calculated offsets */
  private applyTransformations(incomingChangeEvent: ForwardChangeEvent, uid: string, tracker: any) {
    var result: ChangeEvent = [];
    var incomingBeginTime =  incomingChangeEvent.beginTime;
    incomingChangeEvent.changes.forEach((incomingChange, index) => {
      var incomingRange = this.createRange(incomingChange.range);
      tracker.set = false;
      var incomingBeginPosition = incomingChangeEvent.beginPositions[index] ?? incomingRange.getStartPosition();
      for (var i = tracker.start; i < this.appliedEditsLog.length; i++) {
        var appliedEdit = this.appliedEditsLog[i];
        var appliedBeginPosition = appliedEdit.beginPosition ?? appliedEdit.range.getStartPosition();
        var lastHeardFromUser = incomingChangeEvent.userTimestamps[appliedEdit.uid] ?? 0;
        // Transform if previous edit not from same user & happened after last received update from that user 
        if (appliedEdit.uid != uid && appliedEdit.timestamp > lastHeardFromUser) { 
          if (!tracker.set) {
            tracker.set = true;
            tracker.start = i; // optimization to avoid repeatedly looping through same old/irrelevant logged edits
          }
          if (appliedEdit.lineDelta != 0 || Range.spansMultipleLines(appliedEdit.range)) { // Line number change/modified multiple lines
            // Case 1: added content with newline on the same line before incoming change
            if (appliedEdit.range.startLineNumber == incomingRange.startLineNumber
                && appliedEdit.range.getEndPosition().isBeforeOrEqual(incomingRange.getStartPosition())) {
              incomingRange = this.shiftRange(incomingRange, appliedEdit.lineDelta, appliedEdit.bottomLineLength - (appliedEdit.range.startColumn - 1));
            // Case 2: selection replaced all text before incoming on current line and modified lines before
            } else if (appliedEdit.range.endLineNumber == incomingRange.startLineNumber) {
              var colsReplaced = (appliedEdit.newLines > 0) ? appliedEdit.range.endColumn - 1 : appliedEdit.range.endColumn - appliedEdit.range.startColumn;
              var colDelta = appliedEdit.bottomLineLength - colsReplaced;
              incomingRange = this.shiftRange(incomingRange, appliedEdit.lineDelta, colDelta);
            // Case 3: normal line add/remove *not* affecting same line as incoming change
            } else if (appliedEdit.range.getStartPosition().isBeforeOrEqual(incomingRange.getStartPosition())) { 
              incomingRange = this.shiftRange(incomingRange, appliedEdit.lineDelta, 0);
            }
          } else if (appliedEdit.range.startLineNumber == incomingRange.startLineNumber) { // Same line, but not multi-line
            // Case 4: column where began typing is before incoming or equal but timestamp before
            if (appliedBeginPosition.isBefore(incomingBeginPosition)
                || (appliedBeginPosition.equals(incomingBeginPosition) && appliedEdit.beginTime < incomingBeginTime)) {
              var colDelta = (appliedEdit.bottomLineLength - (appliedEdit.range.endColumn - appliedEdit.range.startColumn));
              incomingRange = this.shiftRange(incomingRange, 0, colDelta);
            }
          }
          // TODO: When ranges intersecting: unpredictable, more complicated conflicts need resolving 
          // if (Range.areIntersecting(appliedEdit.range, incomingRange)) { }
          // if (Range.strictContainsRange(appliedEdit.range, incomingRange)) { }
        }
      }
      result.push({
        range: {...incomingRange},
        text: incomingChange.text
      });
    });
    return result;
  }

  private shiftRange(range: Range, lineDelta: number, colDelta: number) {
    return new Range(range.startLineNumber + lineDelta, range.startColumn + colDelta,
                    range.endLineNumber + lineDelta,  range.endColumn + colDelta);
  }

  private createRange(range: IRange): Range {
    return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
  }

  /* Remove all logged transformations older than 10 seconds */
  private pruneTransformations() {
    var recentTransformations: Array<AppliedEdit> = [];
    var currentTime = this.generateTimestamp();
    this.appliedEditsLog.forEach(edit => {
      if (currentTime - edit.timestamp < 10_000) {
        recentTransformations.push(edit);
      }
    });
    return recentTransformations;
  }

  /* Takes edits from a change event and inserts in the sorted log based on timestamp */
  private insertIntoSorted(editsLog: Array<AppliedEdit>, newEdits: Array<AppliedEdit>) {
    if (newEdits == null || newEdits.length == 0)
      return editsLog;
    var index = editsLog.length - 1;
    var time = newEdits[0].timestamp;
    // In most cases, will only need to append to the end to still be sorted
    while (index >= 0) {
      if (editsLog[index].timestamp < time)
        break;
      index--;
    }
    if (index == editsLog.length - 1)
      editsLog.push(...newEdits); 
    else if (index == -1)
      editsLog.unshift(...newEdits);
    else
      editsLog = [...editsLog.slice(0, index + 1), ...newEdits, ...editsLog.slice(index + 1)]
    return editsLog;
  }

  private shortenId(id: string) {
    return id.substr(0, 8);
  }

  private generateTimestamp() {
    const date = new Date();
    return date.getTime(); // TODO: shorten for transfer
  }

}