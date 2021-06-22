// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';
import { ChallengeView, GameState } from '../api/gen/models';
import { faCloudUploadAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-gamespace-quiz',
  templateUrl: './gamespace-quiz.component.html',
  styleUrls: ['./gamespace-quiz.component.scss']
})
export class GamespaceQuizComponent implements OnInit {
  @Input() state!: GameState;
  errors: Error[] = [];
  faSubmit = faCloudUploadAlt;

  constructor(
    private api: GamespaceService
  ) {
  }

  ngOnInit(): void {
  }

  submit(): void {
    const submission = {
      sectionIndex: this.state.challenge?.sectionIndex,
      questions: this.state.challenge?.questions?.map(q => ({answer: q.answer}))
    };
    this.api.grade(this.state.id || '', submission).subscribe(
      (c: ChallengeView) => this.state.challenge = c,
      (err: any) => { console.log(err); this.errors.push(err.error); }
    );
  }
}
