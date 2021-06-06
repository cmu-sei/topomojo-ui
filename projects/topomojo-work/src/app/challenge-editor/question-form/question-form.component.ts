// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { QuestionSpec } from 'projects/topomojo-work/src/app/api/gen/models';
import { ChallengeFormService } from '../challenge-form.service';
import { faTrash, faPlus, faBaby} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.scss']
})
export class QuestionFormComponent implements OnInit {
  @Input() form!: FormGroup;
  @Input() index = 0;
  @Input() vindex = 0;
  @Input() more = false;
  hoveritem = 0;
  matchtip = 0;

  faTrash = faTrash;
  faPlus = faPlus;

  constructor(
    private svc: ChallengeFormService
  ) { }

  ngOnInit(): void {
  }

  get questions(): FormArray {
    return this.form.get('questions') as FormArray;
  }
  addQuestion(q?: QuestionSpec): void {
    this.questions.push(this.svc.mapQuestion(q));
  }
  removeQuestion(index: number): void {
    this.questions.removeAt(index);
  }

}
