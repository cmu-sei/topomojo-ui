// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GamespaceService } from '../api/gamespace.service';
import { GameState } from '../api/gen/models';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-gamespace-quiz',
  templateUrl: './gamespace-quiz.component.html',
  styleUrls: ['./gamespace-quiz.component.scss']
})
export class GamespaceQuizComponent implements OnInit, OnChanges {
  @Input() state!: GameState;
  errors: Error[] = [];
  faSubmit = faCloudUploadAlt;

  protected completedSections: number[] = [];
  protected questionSetCount = 0;

  constructor(private api: GamespaceService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.state) {
      this.bindState(changes.state.currentValue)
    }
  }

  ngOnInit(): void {
  }

  submit(sectionIndex: number): void {
    const submission = {
      sectionIndex,
      questions: this.state.challenge!.variant.sections[sectionIndex].questions.map(q => ({ answer: q.answer }))
    };
    this.api.grade({ ...submission, id: this.state.id }).subscribe(
      (c: GameState) => this.bindState(c),
      (err: any) => { console.log(err); this.errors.push(err.error); }
    );
  }

  private bindState(state: GameState) {
    this.state = state;
    this.completedSections = [];
    this.questionSetCount = 0;

    if (!state.challenge?.variant?.sections?.length) {
      return;
    }

    for (let i = 0; i < state.challenge.variant.sections.length; i++) {
      if (state.challenge.variant.sections[i].questions.every(q => q.isCorrect)) {
        this.completedSections.push(i);
      }
    }

    this.questionSetCount = state.challenge.variant.sections.length;
  }
}
