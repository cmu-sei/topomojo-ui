// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of, Subject, Subscription, timer } from 'rxjs';
import { debounceTime, delay, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { ChallengeFormService } from './challenge-form.service';
import { WorkspaceService } from '../api/workspace.service';
import { ChallengeSpec, VariantSpec, KeyValuePair, QuestionSpec, SectionSpec, Workspace, WorkspaceSummary } from '../api/gen/models';
import { faTrash, faPlus, faCopy, faEllipsisV, faSave, faCloudUploadAlt, faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-challenge-editor',
  templateUrl: './challenge-editor.component.html',
  styleUrls: ['./challenge-editor.component.scss']
})
export class ChallengeEditorComponent implements OnInit, OnChanges {
  @Input() summary!: Workspace;
  form!: FormGroup;
  form$: Observable<FormGroup>;
  id$ = new Subject<string>();
  detail: boolean[] = [];
  showTransformExamples = false;
  editorOptions: any;

  faTrash = faTrash;
  faPlus = faPlus;
  faCopy = faCopy;
  faMore = faEllipsisV;
  faSave = faCloudUploadAlt;
  faHelp = faInfoCircle;

  constructor(
    private api: WorkspaceService,
    private svc: ChallengeFormService,
    config: ConfigService
  ) {
    this.editorOptions = config.embeddedMonacoOptions;

    this.form$ = this.id$.pipe(
      // tap(id => console.log(id)),
      debounceTime(200),
      distinctUntilChanged(),
      switchMap(id => api.getWorkspaceChallenge(id)),
      map(c => svc.mapToForm(c)),
      tap(f => this.form = f)
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.summary) {
      setTimeout(() =>
        this.id$.next(changes.summary.currentValue.globalId),
        0
      );
    }
  }

  ngOnInit(): void {
    const ch = {
      id: 'jam',
      text: 'test text',
      customizeScript: '',
      gradeScript: '',
      transforms: [
        {key: 'jam', value: ':hex:8:'},
        {key: 'maj', value: ':hex:8:'},
      ],
      variants: [{
        iso: {
          file: '',
          targets: ''
        },
        sets: [{
          prerequisite: 0,
          questions: [
            { text: 'one?', answer: '1'},
            { text: 'two?', answer: '2'},
          ]
        }]
      }]
    };

  }


  get transforms(): FormArray {
    return this.form.get('transforms') as FormArray;
  }
  addTransform(kv?: KeyValuePair): void {
    this.transforms?.push(this.svc.mapTransform(kv));
  }
  removeTransform(index: number): void {
    this.transforms.removeAt(index);
  }

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }
  addVariant(v?: VariantSpec): void {
    this.variants.push(this.svc.mapVariant(v));
  }
  removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  save(): void {
    this.api.putWorkspaceChallenge(this.summary.globalId, this.form.value).subscribe();
  }
}
