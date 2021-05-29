import { Injectable } from '@angular/core';
import { Actor, HubEvent, NotificationService } from './notification.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import * as monaco from 'monaco-editor';
import { auditTime, filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {

  appliedEditsLog: AppliedEdit[] = [];
  editorEol: string = "\n";

  constructor(
    private hub: NotificationService
  ) { }

  /* Store any applied edits as a log to apply transformations on future incoming operations */
  storeTransformationLog(edits: Array<ForwardChangeEvent>, uid: string) {
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
  applyTransformations(incomingChangeEvent: ForwardChangeEvent, uid: string, tracker: any) {
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

  /* Remove all logged transformations older than 10 seconds */
  pruneTransformations() {
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
  insertIntoSorted(editsLog: Array<AppliedEdit>, newEdits: Array<AppliedEdit>) {
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

  shiftRange(range: Range, lineDelta: number, colDelta: number) {
    return new Range(range.startLineNumber + lineDelta, range.startColumn + colDelta,
                    range.endLineNumber + lineDelta,  range.endColumn + colDelta);
  }

  createRange(range: IRange): Range {
    return new Range(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
  }

  generateTimestamp() {
    const date = new Date();
    return date.getTime(); // TODO: shorten for transfer
  }

  shortenId(id: string) {
    return id.substr(0, 8);
  }

  /* ----- Manual mapping to smaller data objects to send -----
   For example,'startLineNumber' and 'endLineNumber' become 'sL' and 'eL' */

  mapToForwardChangesDTO(changes: ForwardChangeEvent[]) {
    return changes.map((change) => this.mapToChangeEventDTO(change));
  }

  mapToChangeEventDTO(changeEvent: ForwardChangeEvent) {
    return {
      c: changeEvent.changes.map(change => {
        return { r: this.mapToRangeDTO(change.range), t: change.text }
      }),
      t: changeEvent.timestamp,
      u: changeEvent.userTimestamps,
      bp: this.mapToPositionsDTO(changeEvent.beginPositions),
      bt: changeEvent.beginTime
    };
  }

  mapToRangeDTO(range: IRange) {
    return { 
      sL: range.startLineNumber, sC: range.startColumn,
      eL: range.endLineNumber, eC: range.endColumn
    };
  }

  mapToPositionsDTO(positions: Array<Position>) {
    return positions.map(position => {
        return {l: position.lineNumber, c: position.column }
    })
  }

  mapToSelectionsDTO(selections: CursorSelection[]) {
    return selections.map(selection => {
      var selectionDTO: any = this.mapToRangeDTO(selection);
      if (selection.getDirection() == monaco.SelectionDirection.RTL)
        selectionDTO.r = true
      return selectionDTO;
    });
  }

  mapFromForwardChangesDTO(changesDTO: any[]) {
    return changesDTO.map((change) => this.mapFromChangeEventDTO(change));
  }

  
  mapFromChangeEventDTO(changeEventDTO: any): ForwardChangeEvent {
    return {
      changes: changeEventDTO.c.map((change: any) => {
        return { range: this.mapFromRangeDTO(change.r), text: change.t }
      }),
      timestamp: changeEventDTO.t,
      userTimestamps: changeEventDTO.u,
      beginPositions: this.mapFromPositionsDTO(changeEventDTO.bp),
      beginTime: changeEventDTO.bt
    };
  }

  mapFromRangeDTO(rangeDTO: any): Range {
    return new Range(rangeDTO.sL, rangeDTO.sC,rangeDTO.eL, rangeDTO.eC);
  }

  mapFromPositionsDTO(positions: any[]): Array<Position> {
    return positions.map(position => {
        return new Position(position.l, position.c);
    })
  }

}

// Monaco Type and Class Aliases 
import CursorChangeReason = monaco.editor.CursorChangeReason;
import Position = monaco.Position;
import Range = monaco.Range;
import CursorSelection = monaco.Selection;
export { CursorChangeReason, Position, Range, CursorSelection };
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
    rtl: boolean; // selection is right to left
  }>; 
}

// Data Transfer Object to efficiently send updates over network
export interface DocumentEditsDTO {
  q: any; // editsQueue
  t: number; // timestamp
  b: number; // beginTime
}

export interface AppliedEdit {
  uid: string; // shortened uid of editing user
  range: Range; // range replaced with text
  newLines: number; // number of new lines added
  lineDelta: number; // number of net lines added/subtracted
  bottomLineLength: number; // length of new content (after any new lines)
  timestamp: number; // timestamp of edit
  beginPosition: Position; // editor position when started typing
  beginTime: number; // time when started typing
}

/* Keeping track of last time got updates from each user */
export interface UserTimeMap {
  [uid: string] : number;
}

export interface ForwardChangeEvent {
  changes: ChangeEvent;
  timestamp: number;
  userTimestamps: any;
  beginPositions: Array<Position>;
  beginTime: number;
}