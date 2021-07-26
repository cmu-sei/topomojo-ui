// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, Input, OnInit } from '@angular/core';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { ApiKey } from '../../api/gen/models';
import { ProfileService } from '../../api/profile.service';

@Component({
  selector: 'app-apikeys',
  templateUrl: './apikeys.component.html',
  styleUrls: ['./apikeys.component.scss']
})
export class ApikeysComponent implements OnInit {
  @Input() id = '';
  refresh$ = new BehaviorSubject<boolean>(true);
  list: Observable<ApiKey[]>;
  newKey = '';

  faTrash = faTrash;
  faPlus = faPlus;

  constructor(
    private api: ProfileService
  ) {
    this.list = this.refresh$.pipe(
      debounceTime(300),
      switchMap(() => api.getApiKeys(this.id))
    );
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.refresh$.next(true);
  }

  generate(): void {
    this.api.generateApiKey(this.id)
      .subscribe(r => {
        this.newKey = r.value;
        this.refresh();
      });
  }

  delete(key: ApiKey): void {
    this.api.deleteApiKey(key.id)
      .subscribe(() => this.refresh());
  }

  trackById(index: number, model: ApiKey): string {
    return model.id;
  }
}
