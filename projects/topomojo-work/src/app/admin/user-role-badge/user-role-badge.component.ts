import { Component, inject, input, TemplateRef, viewChild } from '@angular/core';
import { ApiUser } from '../../api/gen/models';
import { ModalComponent } from '../../modal/modal.component';
import { TitleCasePipe } from '@angular/common';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-user-role-badge',
  imports: [
    ModalComponent,
    TitleCasePipe
  ],
  templateUrl: './user-role-badge.component.html',
  styleUrl: './user-role-badge.component.scss'
})
export class UserRoleBadgeComponent {
  user = input.required<ApiUser>();

  private readonly modalService = inject(ModalService);

  protected modalTemplate = viewChild<TemplateRef<any>>("roleElevationModal");

  protected handleModalClosed() {
    this.modalService.dismiss();
  }

  protected handleBadgeClick() {
    if (!this.modalTemplate()) {
      throw new Error("Couldn't resolve the modal template.");
    }

    this.modalService.openTemplate(this.modalTemplate()!);
  }
}
