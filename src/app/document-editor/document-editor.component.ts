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
import { ChangeEvent, CollaborationService, CursorChangeReason, CursorSelection, Editor, EditorViewState, IRange } from '../collaboration.service';
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

  private edits$ = new Subject<Edit>();

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
        } else if (event.action === 'DOCUMENT.VERSION') {
          if (event.model.version > this.lastServerVersion)
            this.lastServerVersion = event.model;
          console.log("VERSION---------", this.lastServerVersion)
        } else if (event.action === 'DOCUMENT.UPDATED') {
          this.applyingRemoteEdits = true;
          if (event.model.version > this.lastServerVersion)
            this.lastServerVersion = event.model.version;
          console.log("VERSION---------", this.lastServerVersion)
          // console.log({t:"VERSION", v:event.model.version})
          this.applyRemoteEdits(event.model.edits, event.actor.id);
          this.applyingRemoteEdits = false;
          if (this.readOnly)
              this.startLockMonitor(); // restart
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
      (edits: any) => {
        // console.log(edits);
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
    this.editsSub.unsubscribe();
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
      var newEdit: Edit = {change: event.changes, version:this.lastServerVersion};
      this.edits$.next(newEdit);
      this.storeTransformationLog([newEdit], "me");
      // this.edits$.next(event.changes);
      // console.log(editor.getModel()?.getVersionId());
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

  changedCursorSelections(event: monaco.editor.ICursorSelectionChangedEvent) {
    this.editorViewChanged(event.reason);
    if (event.reason == CursorChangeReason.ContentFlush)
      return;
    const selections = [event.selection, ...event.secondarySelections]
    this.forwardCursorSelections(selections);
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

  /* Go through all applied edits, filtering by user and timestamp, and transform 
  the range/position of incoming changes with calculated offsets */
  private transform(incomingChangeEvent: Edit, uid: string, incomingBeginTime: number, tracker: any) {
    var result: ChangeEvent = [];
    var incomingBaseVersion = incomingChangeEvent.version;
    incomingChangeEvent.change.forEach((incomingChange, index) => {
      var incomingRange = this.createRange(incomingChange.range);
      tracker.set = false;
      // var incomingBeginPosition = incomingChangeEvent.beginPositions[index] ?? incomingRange.getStartPosition();
      for (var i = tracker.start; i < this.appliedEditsLog.length; i++) {
        var appliedEdit = this.appliedEditsLog[i];
        // console.log({...appliedEdit}, {...incomingChange}, incomingBaseVersion);
        // var appliedBeginPosition = appliedEdit.beginPosition ?? appliedEdit.range.getStartPosition();
        // var lastHeardFromUser = incomingChangeEvent.userTimestamps[appliedEdit.uid] ?? 0;

        // Transform if previous edit not from same user & happened ________ 
        if (appliedEdit.uid != uid && appliedEdit.baseVersion >= incomingBaseVersion) { 
          console.log("need to transform")
          // if (!tracker.set) {
          //   tracker.set = true;
          //   tracker.start = i; // optimization to avoid repeatedly looping through same old/irrelevant logged edits
          // }
          if (appliedEdit.lineDelta != 0 || Range.spansMultipleLines(appliedEdit.range)) { // Line number change/modified multiple lines
            // Case 1: added content with newline on the same line before incoming change
            if (appliedEdit.range.startLineNumber == incomingRange.startLineNumber
                && appliedEdit.range.getEndPosition().isBeforeOrEqual(incomingRange.getStartPosition())) {
              // console.log("case 1")
              incomingRange = this.shiftRange(incomingRange, appliedEdit.lineDelta, appliedEdit.bottomLineLength - (appliedEdit.range.startColumn - 1));
            // Case 2: selection replaced all text before incoming on current line and modified lines before
            } else if (appliedEdit.range.endLineNumber == incomingRange.startLineNumber) {
              // console.log("case 2")
              var colsReplaced = (appliedEdit.newLines > 0) ? appliedEdit.range.endColumn - 1 : appliedEdit.range.endColumn - appliedEdit.range.startColumn;
              var colDelta = appliedEdit.bottomLineLength - colsReplaced;
              incomingRange = this.shiftRange(incomingRange, appliedEdit.lineDelta, colDelta);
            // Case 3: normal line add/remove *not* affecting same line as incoming change
            } else if (appliedEdit.range.getStartPosition().isBeforeOrEqual(incomingRange.getStartPosition())) { 
              // console.log("case 3")
              incomingRange = this.shiftRange(incomingRange, appliedEdit.lineDelta, 0);
            }
          } else if (appliedEdit.range.startLineNumber == incomingRange.startLineNumber) { // Same line, but not multi-line
            // Case 4: column where began typing is before incoming or equal but timestamp before
            // if (appliedBeginPosition.isBefore(incomingBeginPosition)
            //     || (appliedBeginPosition.equals(incomingBeginPosition) && appliedEdit.beginTime < incomingBeginTime)) {
            //   var colDelta = (appliedEdit.bottomLineLength - (appliedEdit.range.endColumn - appliedEdit.range.startColumn));
            //   incomingRange = this.shiftRange(incomingRange, 0, colDelta);
            // }
          }
          // TODO: When ranges intersecting: unpredictable, more complicated conflicts need resolving 
          // if (Range.areIntersecting(appliedEdit.range, incomingRange)) { }
          // if (Range.strictContainsRange(appliedEdit.range, incomingRange)) { }
        } else {
          console.log("don't need to transform")
        }
      }
      result.push({
        range: {...incomingRange},
        text: incomingChange.text
      });
    });
    return result;
  }

  private applyRemoteEdits(changeModel: Array<Edit>, uid: string) {
    this.applyingRemoteEdits = true;
    var allTransformedChanges: Array<Edit> = [];
    var tracker = {start: 0, set: false};
    changeModel.forEach(edit => {
      var version = edit.version;
      var transformedChanges = this.transform(edit, uid, 0, tracker);
      // var position = this.editor.getPosition();
      // var shouldPreserveCursor = this.shouldPreserveCursor(transformedChanges, position);
      // TODO: can use returned undo operations to store/modify so undo stack works with remote editors
      this.editor.getModel()?.applyEdits(transformedChanges); 
      // console.log({t:"undo"}, undo);
      allTransformedChanges.push({
        change: transformedChanges,
        version: version
      })
    });
      // if (shouldPreserveCursor)
      //   this.editor.setPosition(position);
    // });
    this.applyingRemoteEdits = false;
    this.storeTransformationLog(allTransformedChanges, uid);
  }

  /* Store any applied edits as a log to apply transformations on future incoming operations */
  private storeTransformationLog(edits: Array<Edit>, uid: string) {
    // var newLog = this.pruneTransformations();
    edits.forEach(edit => {
      var changeEvent = edit.change;
      var version = edit.version;
      // var newEdits: any[] = [];
      changeEvent.forEach((change, index) => {
        var selectionHeight = change.range.endLineNumber - change.range.startLineNumber;
        var lines = change.text?.split(this.editorEol) ?? [""];
        var newLinesAdded = lines.length - 1;
        var newColsAdded = lines[lines.length - 1].length;
        var lineDelta = newLinesAdded - selectionHeight;
        var appliedEdit = {
          uid: uid,
          lineDelta: lineDelta,
          range: this.createRange(change.range),
          newLines: newLinesAdded,
          bottomLineLength: newColsAdded,
          baseVersion: version
        };
        // newEdits.push(appliedEdit);
        this.appliedEditsLog.push(appliedEdit);
      });
      // newLog = this.insertIntoSorted(newLog, newEdits);
    });
    // this.appliedEditsLog = newLog;
    // console.log("");
    // console.log([...this.appliedEditsLog])
    // console.log("");
  }


  private shiftRange(range: Range, lineDelta: number, colDelta: number) {
    return new Range(range.startLineNumber + lineDelta, range.startColumn + colDelta,
                    range.endLineNumber + lineDelta,  range.endColumn + colDelta);
  }

  private createRange(range: IRange): Range {
    return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
  }
}

export interface Edit {
  change: ChangeEvent;
  version: number;
}