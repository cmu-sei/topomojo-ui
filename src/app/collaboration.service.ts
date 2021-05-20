import { Injectable } from '@angular/core';
import { Actor, HubEvent, NotificationService } from './notification.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import * as monaco from 'monaco-editor';
import { auditTime, filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {

  constructor(
    private hub: NotificationService
  ) {
    console.log("In the constructor of CollaborationService");
  }

  /* ----- Manual mapping to smaller data objects to send -----
   For example,'startLineNumber' and 'endLineNumber' become 'sL' and 'eL' */

  mapToDocumentEditsDTO(edits: DocumentEdits) {
    return {
      q: edits.editsQueue.map(changeEvent => {
        return this.mapToChangeEventDTO(changeEvent);
      }),
      t: edits.timestamp,
      b: edits.beginTime
    };
  }

  mapToChangeEventDTO(changeEvent: TimedChangeEvent) {
    return {
      c: changeEvent.changes.map(change => {
        return { r: this.mapToRangeDTO(change.range), t: change.text }
      }),
      t: changeEvent.timestamp,
      u: changeEvent.userTimestamps,
      bp: this.mapToPositionsDTO(changeEvent.beginPositions)
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

  mapFromDocumentEditsDTO(editsDTO: any): DocumentEdits {
    return {
      editsQueue: editsDTO.q.map((changes: any) => {
        return this.mapFromChangeEventDTO(changes);
      }),
      timestamp: editsDTO.t,
      beginTime: editsDTO.b
    };
  }
  
  mapFromChangeEventDTO(changeEventDTO: any): TimedChangeEvent {
    return {
      changes: changeEventDTO.c.map((change: any) => {
        return { range: this.mapFromRangeDTO(change.r), text: change.t }
      }),
      timestamp: changeEventDTO.t,
      userTimestamps: changeEventDTO.u,
      beginPositions: this.mapFromPositionsDTO(changeEventDTO.bp)
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
    rtl: boolean;
  }>; 
}

export interface DocumentEdits {
  editsQueue: Array<TimedChangeEvent>; // Queued edits to send
  timestamp: number; 
  beginTime: number;
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

export interface TimedChangeEvent {
  changes: ChangeEvent;
  timestamp: number;
  userTimestamps: any;
  beginPositions: Array<Position>;
}