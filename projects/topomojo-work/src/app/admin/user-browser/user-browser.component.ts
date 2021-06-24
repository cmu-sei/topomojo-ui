import { Component, OnInit } from '@angular/core';
import { faFilter, faList, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { Search, ApiUser, UserSearch } from '../../api/gen/models';
import { ProfileService } from '../../api/profile.service';
import { UserService } from '../../user.service';

@Component({
  selector: 'app-user-browser',
  templateUrl: './user-browser.component.html',
  styleUrls: ['./user-browser.component.scss']
})
export class UserBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<ApiUser[]>;
  source: ApiUser[] = [];
  selected: ApiUser[] = [];
  viewed: ApiUser | undefined = undefined;
  viewChange$ = new BehaviorSubject<ApiUser | undefined>(this.viewed);
  search: UserSearch = { term: '', scope: '', take: 100};
  filter = '';
  scope = '';
  scopes: string[] = [];

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;
  faFilter = faFilter;

  constructor(
    private api: ProfileService,
  ) {
    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      tap(r => this.source = r),
      tap(() => this.review()),
    );

    api.listScopes().subscribe(
      result => this.scopes = result
    );
  }

  ngOnInit(): void {
  }

  toggleFilter(role: string): void {
    this.filter = this.filter !== role ? role : '';
    this.search.filter = [this.filter];
    this.refresh$.next(true);
  }

  toggleScope(scope: string): void {
    this.scope = this.scope !== scope ? scope : '';
    this.search.scope = this.scope;
    this.refresh$.next(true);
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

  trackById(index: number, model: ApiUser): string {
    return model.id;
  }
}
