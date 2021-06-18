import { Component, OnInit } from '@angular/core';
import { faBars, faGlobe, faLink, faList, faMehBlank, faSearch, faTrash, faUnlink } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { Search, Template, TemplateDetail, TemplateSummary } from '../../api/gen/models';
import { TemplateService } from '../../api/template.service';

@Component({
  selector: 'app-template-browser',
  templateUrl: './template-browser.component.html',
  styleUrls: ['./template-browser.component.scss']
})
export class TemplateBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<TemplateSummary[]>;
  source: TemplateSummary[] = [];
  selected: TemplateSummary[] = [];
  viewed: TemplateSummary | undefined = undefined;
  viewChange$ = new BehaviorSubject<TemplateSummary | undefined>(this.viewed);
  detail$: Observable<TemplateDetail>;
  search: Search = { term: '', take: 100};

  faTrash = faTrash;
  faList = faList;
  faSearch = faSearch;
  faGlobe = faGlobe;
  faLink = faLink;
  faUnlink = faUnlink;

  constructor(
    private api: TemplateService
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

    this.detail$ = this.viewChange$.pipe(
      filter(t => !!t),
      switchMap(t => api.loadDetail(t?.globalId || ''))
    );
  }

  ngOnInit(): void {
  }

  view(w: TemplateSummary): void {
    this.viewed = this.viewed !== w ? w : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.id === this.viewed?.id);
  }

  delete(w: TemplateSummary): void {
    this.api.delete(w.globalId).subscribe(() => {
      const found = this.source.find(f => f.id === w.id);
      if (found) {
        this.source.splice(
          this.source.indexOf(found),
          1
        );
      }
    });
  }

  update(t: TemplateDetail): void {
    this.api.updateDetail(t).subscribe();
  }

  trackById(index: number, t: TemplateSummary): number {
    return t.id;
  }
}
