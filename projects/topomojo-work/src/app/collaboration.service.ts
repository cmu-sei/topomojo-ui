// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import type { Position, IRange, Range, Selection, editor as MonacoEditor } from 'monaco-editor';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {

  appliedEditsLog: AppliedEdit[] = [];
  editorEol = '\n';

  constructor(
  ) { }

  storeTransformationLog(batches: DocumentChange[], uid: string): void {
    const marker = Date.now() - 10_000;
    this.appliedEditsLog = this.appliedEditsLog
      .filter(e => e.timestamp > marker)
      .concat(
        batches.flatMap(b =>
          b.changes.map((c: EditorChange, i: number) => {
            const lines = c.text?.split(this.editorEol) ?? [''];
            return {
              uid: uid.substr(0, 8),
              timestamp: b.timestamp,
              beginTime: b.beginTime,
              beginPosition: b.beginPositions[i] ?? null,
              newLines: lines.length - 1,
              bottomLineLength: lines[lines.length - 1].length,
              lineDelta: lines.length - 1 - c.range.endLineNumber - c.range.startLineNumber
            } as AppliedEdit;
          })
        )
      )
      .sort((a, b) =>
        a.timestamp < b.timestamp
        ? -1
        : a.timestamp > b.timestamp
          ? 1
          : 0
      );
  }

  /* Go through all applied edits, filtering by user and timestamp, and transform
    the range/position of incoming changes with calculated offsets */
  applyTransformations(doc: DocumentChange, uid: string, tracker: any): EditorChange[] {
    const result: EditorChange[] = [];
    const incomingBeginTime =  doc.beginTime;
    doc.changes.forEach((externalChange, index) => {
      let externalRange = this.createRange(externalChange.range);
      tracker.set = false;
      const incomingBeginPosition = doc.beginPositions[index] ?? externalRange.getStartPosition();

      for (let i = tracker.start; i < this.appliedEditsLog.length; i++) {
        const appliedEdit = this.appliedEditsLog[i];
        const appliedBeginPosition = appliedEdit.beginPosition ?? appliedEdit.range?.getStartPosition();
        const lastHeardFromUser = doc.userTimestamps[appliedEdit.uid] ?? 0;
        // Transform if previous edit not from same user & happened after last received update from that user
        if (!uid.startsWith(appliedEdit.uid) && appliedEdit.timestamp > lastHeardFromUser) {

          if (!tracker.set) {
            tracker.set = true;
            tracker.start = i; // optimization to avoid repeatedly looping through same old/irrelevant logged edits
          }

          if (
            appliedEdit.lineDelta !== 0 ||
            appliedEdit.range.endLineNumber > appliedEdit.range.startLineNumber
          ) { // Line number change/modified multiple lines

            // Case 1: added content with newline on the same line before incoming change
            if (
              appliedEdit.range.startLineNumber === externalRange.startLineNumber &&
              appliedEdit.range.getEndPosition().isBeforeOrEqual(externalRange.getStartPosition())
            ) {
              externalRange = this.shiftRange(
                externalRange,
                appliedEdit.lineDelta,
                appliedEdit.bottomLineLength - (appliedEdit.range.startColumn - 1)
              );

              // Case 2: selection replaced all text before incoming on current line and modified lines before
            } else if (appliedEdit.range.endLineNumber === externalRange.startLineNumber) {
              const colsReplaced = (appliedEdit.newLines > 0)
                ? appliedEdit.range.endColumn - 1
                : appliedEdit.range.endColumn - appliedEdit.range.startColumn;
              const colDelta = appliedEdit.bottomLineLength - colsReplaced;
              externalRange = this.shiftRange(externalRange, appliedEdit.lineDelta, colDelta);

              // Case 3: normal line add/remove *not* affecting same line as incoming change
            } else if (appliedEdit.range.getStartPosition().isBeforeOrEqual(externalRange.getStartPosition())) {
              externalRange = this.shiftRange(externalRange, appliedEdit.lineDelta, 0);
            }

            // Same line, but not multi-line
          } else if (appliedEdit.range.startLineNumber === externalRange.startLineNumber) {

            // Case 4: column where began typing is before incoming or equal but timestamp before
            if (appliedBeginPosition.isBefore(incomingBeginPosition) ||
              (
                appliedBeginPosition.equals(incomingBeginPosition) &&
                appliedEdit.beginTime < incomingBeginTime
              )
            ) {
              const colDelta = (appliedEdit.bottomLineLength - (appliedEdit.range.endColumn - appliedEdit.range.startColumn));
              externalRange = this.shiftRange(externalRange, 0, colDelta);
            }
          }

          // TODO: When ranges intersecting: unpredictable, more complicated conflicts need resolving
          // if (Range.areIntersecting(appliedEdit.range, incomingRange)) { }
          // if (Range.strictContainsRange(appliedEdit.range, incomingRange)) { }
        }
      }
      result.push({
        range: {...externalRange},
        text: externalChange.text
      });

    });

    return result;
  }

  shiftRange(range: Range, lineDelta: number, colDelta: number): Range {
    return {
      startLineNumber: range.startLineNumber + lineDelta,
      startColumn: range.startColumn + colDelta,
      endLineNumber: range.endLineNumber + lineDelta,
      endColumn: range.endColumn + colDelta
    } as Range;
  }

  createRange(range: IRange): Range {
    return {
      startLineNumber: range.startLineNumber,
      startColumn: range.startColumn,
      endLineNumber: range.endLineNumber,
      endColumn: range.endColumn
    } as Range;
  }

  /* ----- Manual mapping to smaller data objects to send -----
   For example,'startLineNumber' and 'endLineNumber' become 'sL' and 'eL' */

  toDocumentChangesDTO(changes: DocumentChange[]): DocumentChangeDTO[] {
    return changes.map((change) => this.toDocumentChangeDTO(change));
  }

  toDocumentChangeDTO(changeEvent: DocumentChange): DocumentChangeDTO {
    return {
      c: changeEvent.changes.map(change => {
        return { r: this.toRangeDTO(change.range), t: change.text } as ChangeDTO;
      }),
      t: changeEvent.timestamp,
      u: changeEvent.userTimestamps,
      p: this.toPositionsDTO(changeEvent.beginPositions),
      b: changeEvent.beginTime
    };
  }

  toRangeDTO(range: IRange): RangeDTO {
    return {
      s: { l: range.startLineNumber, c: range.startColumn },
      e: { l: range.endLineNumber, c: range.endColumn }
    };
  }

  toPositionsDTO(positions: Position[]): PositionDTO[] {
    return positions.map(position => {
        return { l: position.lineNumber, c: position.column } as PositionDTO;
    });
  }

  toSelectionsDTO(selections: Selection[]): any {
    return selections.map(selection => {
      const selectionDTO: SelectionDTO = this.toRangeDTO(selection) as SelectionDTO;
      selectionDTO.r = selection.getDirection() === 1; //SelectionDirection.RTL;
      return selectionDTO;
    });
  }

  toDocumentChanges(changesDTO: DocumentChangeDTO[]): DocumentChange[] {
    return changesDTO.map((change) => this.toDocumentChange(change));
  }

  toDocumentChange(dto: DocumentChangeDTO): DocumentChange {
    return {
      changes: dto.c.map((change: ChangeDTO) => {
        return { range: this.toRange(change.r), text: change.t };
      }),
      timestamp: dto.t,
      userTimestamps: dto.u,
      beginPositions: this.toPositions(dto.p),
      beginTime: dto.b
    };
  }

  toRange(rangeDTO: RangeDTO): Range {
    return {
      startLineNumber: rangeDTO.s.l,
      startColumn: rangeDTO.s.c,
      endLineNumber: rangeDTO.e.l,
      endColumn: rangeDTO.e.c
    } as Range;
  }

  toPositions(positions: PositionDTO[]): Position[] {
    return positions.map(position =>
      ({lineNumber: position.l, column: position.c} as Position)
    );
  }

}

export { Position, Range, Selection, MonacoEditor };
export type Editor = MonacoEditor.ICodeEditor;
export type EditorChange =  MonacoEditor.ISingleEditOperation;
export type EditorOptions = MonacoEditor.IStandaloneEditorConstructionOptions;
export type EditorViewState = MonacoEditor.ICodeEditorViewState;

export interface RemoteUserData {
  name: string;
  color: string;
  positions: CursorPosition[];
}

export interface CursorPosition {
  range: Range;
  rtl: boolean;
}

// Data Transfer Object to efficiently send updates over network

export interface AppliedEdit {
  uid: string; // shortened uid of editing user
  timestamp: number; // timestamp of edit
  beginTime: number; // time when started typing
  beginPosition: Position; // editor position when started typing
  range: Range; // range replaced with text
  newLines: number; // number of new lines added
  bottomLineLength: number; // length of new content (after any new lines)
  lineDelta: number; // number of net lines added/subtracted
}

/* Keeping track of last time got updates from each user */
export interface UserTimeMap {
  [uid: string]: number;
}

export interface DocumentChange {
  changes: EditorChange[];
  timestamp: number;
  userTimestamps: UserTimeMap;
  beginPositions: Position[];
  beginTime: number;
}

export interface DocumentChangeDTO {
  c: ChangeDTO[];
  u: UserTimeMap;
  p: PositionDTO[];
  t: number;
  b: number;
}

export interface ChangeDTO {
  r: RangeDTO;
  t: string;
}

export interface RangeDTO {
  s: PositionDTO; // start
  e: PositionDTO; // end
}

export interface SelectionDTO extends RangeDTO {
  r: boolean;
}

export interface PositionDTO {
  l: number; // line
  c: number; // column
}
