// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { ChangedTemplate, IsoFile, Template } from '../api/gen/models';
import { TemplateService } from '../api/template.service';
import { faUnlink, faToggleOff, faToggleOn, faTimes, faLink } from '@fortawesome/free-solid-svg-icons';
import { ClipboardService } from '../clipboard.service';

@Component({
  selector: 'app-template-editor-form',
  templateUrl: './template-editor-form.component.html',
  styleUrls: ['./template-editor-form.component.scss']
})
export class TemplateEditorFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() template!: Template;
  @ViewChild(NgForm) form!: UntypedFormGroup;
  private sub!: Subscription;

  faLink = faLink;
  faUnlink = faUnlink;
  faToggleOff = faToggleOff;
  faToggleOn = faToggleOn;
  faTimes = faTimes;

  constructor(
    private api: TemplateService,
    private clipboard: ClipboardService
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.sub = this.form.valueChanges.pipe(
      // tap(f => console.log(f)),
      filter(f => !this.form.pristine && (this.form.valid || false)),
      switchMap(f => this.api.update(f as ChangedTemplate))
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.sub && !this.sub.closed) {
      this.sub.unsubscribe();
    }
  }

  nospace(e: Event): void {
    const target = e.target as HTMLInputElement;
    target.value = target.value.replace(/ /g, '-');
  }

  isoSelect(f: IsoFile): void {
    this.template.iso = f.path;
    this.form.controls.iso.markAsDirty();
    this.form.controls.iso.setValue(f.path);
  }

  isoClear(): void {
    this.isoSelect({path: '', display: ''});
  }

}
