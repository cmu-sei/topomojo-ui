// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { ChangedTemplate, Template } from '../api/gen/models';
import { TemplateService } from '../api/template.service';
import { faUnlink, faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-template-editor-form',
  templateUrl: './template-editor-form.component.html',
  styleUrls: ['./template-editor-form.component.scss']
})
export class TemplateEditorFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() template!: Template;
  @ViewChild(NgForm) form!: FormGroup;
  private sub!: Subscription;

  faUnlink = faUnlink;
  faToggleOff = faToggleOff;
  faToggleOn = faToggleOn;

  constructor(
    private api: TemplateService
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.sub = this.form.valueChanges.pipe(
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
}
