// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { SectionSpec, IsoFile } from 'projects/topomojo-work/src/app/api/gen/models';
import { ChallengeFormService } from '../challenge-form.service';
import { faArrowUp, faArrowDown, faTrash, faPlus, faCopy, faEllipsisV, faTimes, faToggleOn, faToggleOff, faClone } from '@fortawesome/free-solid-svg-icons';
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
