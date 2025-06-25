// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { ChallengeFormService } from './challenge-form.service';
import { WorkspaceService } from '../api/workspace.service';
import { VariantSpec, KeyValuePair, Workspace } from '../api/gen/models';
import { faTrash, faPlus, faCopy, faEllipsisV, faCloudUploadAlt, faInfoCircle, faCheckSquare, faSquare} from '@fortawesome/free-solid-svg-icons';
import { ConfigService, LocalAppSettings } from '../config.service';

@Component({
    selector: 'app-challenge-editor',
    templateUrl: './challenge-editor.component.html',
    styleUrls: ['./challenge-editor.component.scss'],
    standalone: false
})
export class ChallengeEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() summary!: Workspace;
  form!: UntypedFormGroup;
  form$: Observable<UntypedFormGroup>;
  id$ = new Subject<string>();
  detail: boolean[] = [];
  showDetail = false;
  showTransformExamples = false;
  editorOptions: any;

  faTrash = faTrash;
  faPlus = faPlus;
  faCopy = faCopy;
  faMore = faEllipsisV;
  faSave = faCloudUploadAlt;
  faHelp = faInfoCircle;
  faCheck = faCheckSquare;
  faUnchecked = faSquare;

  constructor(
    private api: WorkspaceService,
    private svc: ChallengeFormService,
    private config: ConfigService
  ) {
    this.editorOptions = config.embeddedMonacoOptions;
    this.showDetail = config.local.detail || false;

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
        this.id$.next(changes.summary.currentValue.id),
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

  ngOnDestroy(): void {
    this.config.updateLocal({detail: this.showDetail} as LocalAppSettings);
  }

  get transforms(): UntypedFormArray {
    return this.form.get('transforms') as UntypedFormArray;
  }
  addTransform(kv?: KeyValuePair): void {
    this.transforms?.push(this.svc.mapTransform(kv));
  }
  removeTransform(index: number): void {
    this.transforms.removeAt(index);
  }

  get variants(): UntypedFormArray {
    return this.form.get('variants') as UntypedFormArray;
  }
  addVariant(v?: VariantSpec): void {
    this.variants.push(this.svc.mapVariant(v));
  }
  removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  save(): void {
    this.api.putWorkspaceChallenge(this.summary.id, this.form.value).subscribe();
  }

  updateDetail(): void {
    this.config.updateLocal({detail: this.showDetail} as LocalAppSettings);
  }
}
