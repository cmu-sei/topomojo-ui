// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ChallengeSpec, VariantSpec, KeyValuePair, QuestionSpec, SectionSpec } from '../api/gen/models';

@Injectable({
  providedIn: 'root'
})
export class ChallengeFormService {

  constructor(
    private fb: UntypedFormBuilder
  ) { }

  mapToForm(c?: ChallengeSpec): UntypedFormGroup {
    if (!c || c.variants?.length === 0) {
      c = { variants: [{sections: [{questions: [{}]}]}]};
    }
    return this.fb.group({
      // id: [ch.id, Validators.required],
      text: [c?.text],
      customizeScript: [c?.customizeScript],
      gradeScript: [c?.gradeScript],
      transforms: this.fb.array(
        c?.transforms?.map(kv => this.mapTransform(kv)) || []
      ),
      variants: this.fb.array(
        c?.variants?.map(v => this.mapVariant(v)) || []
      ),
    });
  }

  mapTransform(kv?: KeyValuePair): UntypedFormGroup {
    return this.fb.group({
      key: [kv?.key || '', Validators.required],
      value: [kv?.value || '', Validators.required]
    });
  }

  mapVariant(v?: VariantSpec): UntypedFormGroup {
    if (!v) {
      v = {sections: [{questions: [{}]}]};
    }
    return this.fb.group({
      text: [v?.text],
      iso: this.fb.group({
        file: [v?.iso?.file],
        targets: [v?.iso?.targets],
        downloadable: [v?.iso?.downloadable]
      }),
      sections: this.fb.array(
        v?.sections?.map(s => this.mapQuestionSet(s)) || []
      )
    });
  }

  mapQuestionSet(s?: SectionSpec): UntypedFormGroup {
    if (!s) {
      s = {questions: [{}]};
    }
    return this.fb.group({
      text: [s?.text],
      prerequisite: [s?.prerequisite || 0, Validators.pattern(/\d*/)],
      questions: this.fb.array(
        s?.questions?.map(q => this.mapQuestion(q)) || []
      )
    });
  }

  mapQuestion(q?: QuestionSpec): UntypedFormGroup {
    return this.fb.group({
      text: [q?.text, Validators.required],
      answer: [q?.answer, Validators.required],
      example: [q?.example],
      hint: [q?.hint],
      penalty: [q?.penalty || 0, Validators.pattern(/\d*/)],
      grader: [q?.grader || 'match'],
      weight: [q?.weight || 0, Validators.pattern(/\d*/)],
      hidden: [q?.hidden || false]
    });
  }
}
