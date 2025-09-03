// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { faToggleOff, faToggleOn } from '@fortawesome/free-solid-svg-icons';
import { ChangedTemplateDetail, TemplateDetail } from '../../api/gen/models';
import { TemplateService } from '../../api/template.service';

@Component({
    selector: 'app-template-detail-form',
    templateUrl: './template-detail-form.component.html',
    styleUrls: ['./template-detail-form.component.scss'],
    standalone: false
})
export class TemplateDetailFormComponent implements OnInit {
  @Input() template!: TemplateDetail;
  @Input() linked = true;
  @ViewChild(NgForm) form!: NgForm;
  errors: any[] = [];

  faToggleOn = faToggleOn;
  faToggleOff = faToggleOff;

  constructor(
    private api: TemplateService
  ) { }

  ngOnInit(): void {
  }

  update(): void {
    if (!this.template) { return; }
    try {
      if (!!this.template.detail) {
        const s = JSON.parse(this.template?.detail || '');
      }
      // console.log(this.template);
      this.api.updateDetail(this.template as ChangedTemplateDetail).subscribe(
          (data) => {
              this.form.reset(this.form.value);
          },
          (err) => { }
      );
    } catch (e) {
        this.errors.push(e);
    }
  }

}
