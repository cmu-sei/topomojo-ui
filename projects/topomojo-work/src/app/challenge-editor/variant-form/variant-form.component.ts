// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { SectionSpec, IsoFile } from 'projects/topomojo-work/src/app/api/gen/models';
import { ChallengeFormService } from '../challenge-form.service';
import { faArrowUp, faArrowDown, faTrash, faPlus, faCopy, faEllipsisV, faTimes, faToggleOn, faToggleOff, faClone, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { ConfigService } from 'projects/topomojo-work/src/app/config.service';

@Component({
    selector: 'app-variant-form',
    templateUrl: './variant-form.component.html',
    styleUrls: ['./variant-form.component.scss'],
    standalone: false
})
export class VariantFormComponent {
  @Input() form!: UntypedFormGroup;
  @Input() index = 0;
  @Input() detail = false;
  @Input() guid = '';
  more: boolean[] = [];
  editorOptions: any;

  faArrowUp = faArrowUp;
  faArrowDown = faArrowDown;
  faTrash = faTrash;
  faPlus = faPlus;
  faClone = faClone;
  faCopy = faCopy;
  faMore = faEllipsisV;
  faTimes = faTimes;
  faToggleOn = faToggleOn;
  faToggleOff = faToggleOff;
  faInfoCircle = faInfoCircle;

  constructor(
    private svc: ChallengeFormService,
    config: ConfigService
  ) {
    this.editorOptions = config.embeddedMonacoOptions;
    this.form = svc.mapVariant({});
  }

  get sections(): UntypedFormArray {
    return this.form.get('sections') as UntypedFormArray;
  }

  // Warn when the variant's question weights can't reach the full challenge total.
  // At deploy time TopoMojo normalizes weights across ALL of a variant's questions,
  // dividing by max(sum, 100) when the sum exceeds 1. If every question is weighted
  // and the weights sum to less than a full challenge (1 on a 0-1 scale, 100 on a
  // 0-100 scale), the remainder is unreachable - the gamespace can never score 100%.
  // A single weight-0 question absorbs the remainder, so that case is not flagged.
  // This is an author-time hint only; it does not change scoring.
  get weightCoverageWarning(): string | null {
    const weights: number[] = [];
    for (const section of this.sections.controls) {
      const qs = section.get('questions') as UntypedFormArray;
      if (!qs) { continue; }
      for (const q of qs.controls) {
        weights.push(+q.get('weight')?.value || 0);
      }
    }
    if (weights.length === 0 || weights.some(w => w === 0)) { return null; }

    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum <= 0) { return null; }

    const reachable = sum <= 1 ? sum : sum / Math.max(sum, 100);
    if (reachable >= 0.999) { return null; }

    const pct = Math.round(reachable * 100);
    return `Question weights reach only ${pct}% of this variant's score; the remaining ${100 - pct}% is unreachable. `
      + `Make the weights sum to 100 (or 1), or set one question's weight to 0 to distribute the remainder.`;
  }

  addSet(s?: SectionSpec): void {
    this.sections.push(this.svc.mapQuestionSet(s));
  }

  removeSet(index: number): void {
    this.sections.removeAt(index);
  }

  updateSectionIndex(currentIndex: number, increment: number) {
    const section = (this.form.get("sections") as UntypedFormArray);
    const currentSectionControl = section.at(currentIndex);
    const newIndex = currentIndex + increment;

    section.removeAt(currentIndex);
    section.insert(newIndex, currentSectionControl);
  }

  isoClear(): void {
    const c = this.form.get('iso.file');
    c?.setValue('');
  }

  isoSelect(iso: IsoFile): void {
    const c = this.form.get('iso.file');
    c?.setValue(iso.path);
  }
}
