// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core';
import { faFilter, faList, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { ApiUser, UserSearch } from '../../api/gen/models';
import { ProfileService } from '../../api/profile.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-user-browser',
  templateUrl: './user-browser.component.html',
  styleUrls: ['./user-browser.component.scss'],
  standalone: false
})
export class UserBrowserComponent implements OnInit {
  private readonly modalService = inject(ModalService);

  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<ApiUser[]>;
  source: ApiUser[] = [];
  selected: ApiUser[] = [];
  viewed: ApiUser | undefined = undefined;
  viewChange$ = new BehaviorSubject<ApiUser | undefined>(this.viewed);
  search: UserSearch = { term: '', scope: '', take: 100 };
  skip = 0;
  take = 100;
  count = 0;
  filter = '';
  scope = '';
  scopes: string[] = [];

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;
  faFilter = faFilter;

  protected modalTemplate = viewChild<TemplateRef<any>>("identityRoleConflictModal");
  protected identityRoleConflictModalUser = signal<ApiUser | null>(null);

  constructor(private api: ProfileService) {
    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      tap(r => this.source = r),
      tap(r => this.count = r.length),
      tap(() => this.review()),
    );

    api.listScopes().subscribe(
      result => this.scopes = result
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.search.skip = this.skip;
    this.search.take = this.take;
    this.refresh$.next(true);
  }

  paged(s: number): void {
    this.skip = s;
    this.refresh();
  }

  termed(): void {
    this.skip = 0;
    this.refresh();
  }

  toggleFilter(role: string): void {
    this.filter = this.filter !== role ? role : '';
    this.search.filter = [this.filter];
    this.skip = 0;
    this.refresh();
  }

  toggleScope(scope: string): void {
    this.scope = this.scope !== scope ? scope : '';
    this.search.scope = this.scope;
    this.skip = 0;
    this.refresh();
  }

  toggleServiceAccountFilter() {
    if (this.search.isServiceAccount) {
      delete this.search.isServiceAccount;
    }
    else {
      this.search.isServiceAccount = true;
    }

    this.skip = 0;
    this.refresh();
  }

  create(): void {
    this.api.update({
      name: this.search.term || 'NEW-USER'
    }).pipe(
      debounceTime(500)
    ).subscribe(
      (u: ApiUser) => {
        this.source.unshift(u);
        this.view(u);
      }
    );
  }

  view(u: ApiUser): void {
    this.viewed = this.viewed !== u ? u : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.id === this.viewed?.id);
  }

  delete(model: ApiUser): void {
    this.api.delete(model.id).subscribe(() => {
      const found = this.source.find(f => f.id === model.id);
      if (found) {
        this.source.splice(
          this.source.indexOf(found),
          1
        );
      }
    });

  }

  update(model: ApiUser): void {
    this.api.update(model).subscribe();
  }

  updateRole(model: ApiUser, newRole: string) {
    model.appRole = newRole;
    this.update(model);
  }

  trackById(index: number, model: ApiUser): string {
    return model.id;
  }

  protected handleModalClosed() {
    this.modalService.dismiss();
  }

  protected handleIdentityConflictClick(user: ApiUser) {
    if (!this.modalTemplate()) {
      throw new Error("Couldn't resolve the modal template.");
    }

    this.identityRoleConflictModalUser.update(() => user);
    this.modalService.openTemplate(this.modalTemplate()!);
  }
}
