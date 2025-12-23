// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { faCopy, faEye, faFilter, faGlobe, faLink, faList, faSearch, faTrash, faUnlink, faSortUp, faSortDown, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, first, switchMap, tap } from 'rxjs/operators';
import { TemplateDetail, TemplateSearch, TemplateSummary } from '../../api/gen/models';
import { TemplateService } from '../../api/template.service';

@Component({
    selector: 'app-template-browser',
    templateUrl: './template-browser.component.html',
    styleUrls: ['./template-browser.component.scss'],
    standalone: false
})
export class TemplateBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<TemplateSummary[]>;
  source: TemplateSummary[] = [];
  selected: TemplateSummary[] = [];
  viewed: TemplateSummary | undefined = undefined;
  viewChange$ = new BehaviorSubject<TemplateSummary | undefined>(this.viewed);
  detail$: Observable<TemplateDetail>;
  search: TemplateSearch = { term: '', skip: 0, take: 100};
  skip = 0;
  take = 100;
  count = 0;
  filterPublished = false;
  filterTag = "";

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;
  faGlobe = faGlobe;
  faLink = faLink;
  faUnlink = faUnlink;
  faEye = faEye;
  faFilter = faFilter;
  faCopy = faCopy;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faStarSolid = faStarSolid;
  faStarRegular = faStarRegular;

  favorites = new Set<string>();
  sortAscending = true;
  sortField: 'name' | 'created' = 'created';

  constructor(
    route: ActivatedRoute,
    private api: TemplateService
  ) {
    this.search.term = route.snapshot.queryParams.term;

    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list(this.search)),
      tap(r => this.source = r),
      tap(() => this.review()),
      tap(() => this.applySort()),
      tap(() => this.count = this.source.length)
    );

    this.detail$ = this.viewChange$.pipe(
      filter(t => !!t),
      switchMap(t => api.loadDetail(t?.id || ''))
    );
  }

  ngOnInit(): void {
    this.api.listTemplateFavorites().subscribe({
      next: (ids) => {
        this.favorites = new Set(ids || []);
        this.applySort();
        this.refresh$.next(true);
      }
    });
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

  view(w: TemplateSummary): void {
    this.viewed = this.viewed !== w ? w : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.id === this.viewed?.id);
  }

  delete(w: TemplateSummary): void {
    this.api.delete(w.id).subscribe(() => {
      const found = this.source.find(f => f.id === w.id);
      if (found) {
        this.source.splice(
          this.source.indexOf(found),
          1
        );
      }
    });
  }

  create(): void {
    this.api.createDetail({name: 'template'} as TemplateDetail).subscribe(
      r => {
        this.source.unshift(r as TemplateSummary);
        this.view(r as TemplateSummary);
      }
    );
  }

  update(t: TemplateDetail): void {
    this.api.updateDetail(t).subscribe();
  }

  trackById(index: number, t: TemplateSummary): string {
    return t.id;
  }

  filterParent(m: TemplateSummary): void {
    this.search.pid = m.parentId;
    this.filterTag = m.parentName || "";
    this.paged(0);
  }

  clearParent(): void {
    this.search.pid = undefined;
    this.paged(0);
  }

  // filterSource(m: TemplateSummary): void {
  //   this.search.sid = m.sourceId;
  //   this.filterTag = m.sourceName || "";
  //   this.paged(0);
  // }

  // clearSource(): void {
  //   this.search.sid = undefined;
  //   this.paged(0);
  // }

  filterWorkspace(id: string): void {
    this.search.term = id;
    this.termed();
  }

  togglePublished(): void {
    this.filterPublished = !this.filterPublished;
    this.search.filter = this.filterPublished ? ['published'] : [];
    this.termed();
  }

  clone(m: TemplateSummary): void {
    this.api.clone({id: m.id}).pipe(
      first()
    ).subscribe(_ => this.refresh())
  }

  sortBy(field: 'name' | 'created'): void {
    if (this.sortField === field) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortField = field;
      this.sortAscending = field === 'name';
    }
    this.applySort();
  }

  private applySort(): void {
    const dir = this.sortAscending ? 1 : -1;

    this.source.sort((a, b) => {
      const af = this.isFavorite(a.id) ? 1 : 0;
      const bf = this.isFavorite(b.id) ? 1 : 0;
      if (af !== bf) return bf - af;

      let av: any;
      let bv: any;

      if (this.sortField === 'name') {
        av = (a.name || '').toLowerCase();
        bv = (b.name || '').toLowerCase();
      } else {
        av = new Date((a as any).whenCreated).getTime();
        bv = new Date((b as any).whenCreated).getTime();
      }

      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;

      return (a.id < b.id ? -1 : 1);
    });
  }

  isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  toggleFavorite(id: string): void {
    const currentlyFav = this.isFavorite(id);

    currentlyFav ? this.favorites.delete(id) : this.favorites.add(id);
    this.applySort();

    const req$ = currentlyFav
      ? this.api.unfavoriteTemplate(id)
      : this.api.favoriteTemplate(id);

    req$.subscribe({
      error: () => {
        currentlyFav ? this.favorites.add(id) : this.favorites.delete(id);
        this.applySort();
      }
    });
  }
}
