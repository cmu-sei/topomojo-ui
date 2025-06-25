// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { GamespaceService } from '../api/gamespace.service';
import { ChallengeProgressView, GameState } from '../api/gen/models';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-gamespace-quiz',
    templateUrl: './gamespace-quiz.component.html',
    styleUrls: ['./gamespace-quiz.component.scss'],
    standalone: false
})
export class GamespaceQuizComponent implements OnInit, OnChanges {
  @Input() state!: GameState;
  errors: Error[] = [];
  faSubmit = faCloudUploadAlt;

  protected completedSections: number[] = [];
  protected challengeProgress?: ChallengeProgressView;
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
    if (!this.challengeProgress)
      throw new Error("Challenge progress unresolved");

    const submission = {
      sectionIndex,
      questions: this.challengeProgress?.variant.sections[sectionIndex].questions.map(q => ({ answer: q.answer }))
    };

    this.api.grade({ ...submission, id: this.state.id }).subscribe(
      (c: GameState) => this.bindState(c),
      (err: any) => { console.log(err); this.errors.push(err.error); }
    );
  }

  private async bindState(state: GameState) {
    this.state = state;

    if (!state?.id) {
      return;
    }

    this.completedSections = [];
    this.questionSetCount = 0;
    this.challengeProgress = await firstValueFrom(this.api.getChallengeProgress(state.id));

    if (!this.challengeProgress.variant.sections.length)
      return;

    for (let i = 0; i < this.challengeProgress.variant.sections.length; i++) {
      if (this.challengeProgress.variant.sections[i].questions.every(q => q.isCorrect)) {
        this.completedSections.push(i);
      }
    }

    this.questionSetCount = this.challengeProgress.variant.totalSectionCount;
  }
}
