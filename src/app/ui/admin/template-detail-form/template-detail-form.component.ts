// Copyright 2020 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { TemplateDetail } from '../../../api/gen/models';
import { NgForm } from '@angular/forms';
import { TemplateService } from '../../../api/template.service';

@Component({
  selector: 'topomojo-template-detail-form',
  templateUrl: './template-detail-form.component.html',
  styleUrls: ['./template-detail-form.component.scss']
})
export class TemplateDetailFormComponent implements OnInit {
  @Input() template: TemplateDetail;
  @ViewChild(NgForm) form: NgForm;
  errors: Array<Error> = [];

  constructor(
    private templateSvc: TemplateService
  ) { }

  ngOnInit() {
  }

  update() {
    try {
        const s = JSON.parse(this.template.detail);
        this.templateSvc.updateDetail(this.template).subscribe(
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
