import { Component, OnInit } from '@angular/core';
import { faList, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { Search, ApiUser } from '../../api/gen/models';
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
  search: Search = { term: '', take: 100};

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;

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

  }

  ngOnInit(): void {
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
