// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ChallengeSet, QuestionSet } from 'src/app/api/gen/models';
import { ChallengeFormService } from '../challenge-form.service';
import { faTrash, faPlus, faCopy, faEllipsisV} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-variant-form',
  templateUrl: './variant-form.component.html',
  styleUrls: ['./variant-form.component.scss']
})
export class VariantFormComponent implements OnInit {
  @Input() form!: FormGroup;
  @Input() index = 0;
  @Input() detail = false;
  more: boolean[] = [];

  faTrash = faTrash;
  faPlus = faPlus;
  faCopy = faCopy;
  faMore = faEllipsisV;

  constructor(
    private svc: ChallengeFormService
  ) {
    this.form = svc.mapVariant({});
  }

  ngOnInit(): void {
  }

  get sets(): FormArray {
    return this.form.get('sets') as FormArray;
  }
  addSet(s?: QuestionSet): void {
    this.sets.push(this.svc.mapQuestionSet(s));
  }
  removeSet(index: number): void {
    this.sets.removeAt(index);
  }
}
