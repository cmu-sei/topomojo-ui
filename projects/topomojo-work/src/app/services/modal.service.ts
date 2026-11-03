// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { inject, Injectable, signal, TemplateRef } from '@angular/core';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly bootstrapModal = inject(BsModalService)
  private readonly _currentModalRef = signal<BsModalRef | null>(null);

  public openTemplate(template: TemplateRef<any>) {
    const modal = this.bootstrapModal.show(template, { class: "modal-dialog-centered" });
    this._currentModalRef.update(() => modal);
  }

  public dismiss() {
    if (this._currentModalRef()) {
      this._currentModalRef()!.hide();
      this._currentModalRef.update(() => null);
    }
  }
}
