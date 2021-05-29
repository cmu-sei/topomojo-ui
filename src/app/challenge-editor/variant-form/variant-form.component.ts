// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { VariantSpec, SectionSpec } from 'src/app/api/gen/models';
import { ChallengeFormService } from '../challenge-form.service';
import { faTrash, faPlus, faCopy, faEllipsisV} from '@fortawesome/free-solid-svg-icons';
import { ConfigService } from 'src/app/config.service';

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
  editorOptions: any;

  faTrash = faTrash;
  faPlus = faPlus;
  faCopy = faCopy;
  faMore = faEllipsisV;

  constructor(
    private svc: ChallengeFormService,
    config: ConfigService
  ) {
    this.editorOptions = config.embeddedMonacoOptions;
    this.form = svc.mapVariant({});
  }

  ngOnInit(): void {
  }

  get sections(): FormArray {
    return this.form.get('sections') as FormArray;
  }
  addSet(s?: SectionSpec): void {
    this.sections.push(this.svc.mapQuestionSet(s));
  }
  removeSet(index: number): void {
    this.sections.removeAt(index);
  }
}
