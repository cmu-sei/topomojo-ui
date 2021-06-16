import { Component, OnInit } from '@angular/core';
import { faCheck, faCheckSquare, faList, faSearch, faSquare, faSync, faSyncAlt, faTintSlash, faTrash } from '@fortawesome/free-solid-svg-icons';
import { BehaviorSubject, interval, merge, Observable, Subject } from 'rxjs';
import { debounceTime, filter, switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../../api/gamespace.service';
import { Gamespace, Vm } from '../../api/gen/models';
import { VmService } from '../../api/vm.service';

@Component({
  selector: 'app-gamespace-browser',
  templateUrl: './gamespace-browser.component.html',
  styleUrls: ['./gamespace-browser.component.scss']
})
export class GamespaceBrowserComponent implements OnInit {
  refresh$ = new BehaviorSubject<boolean>(true);
  source$: Observable<Gamespace[]>;
  source: Gamespace[] = [];
  selected: Gamespace[] = [];
  viewed: Gamespace | undefined = undefined;
  vms$: Observable<Vm[]>;
  viewChange$ = new BehaviorSubject<Gamespace | undefined>(this.viewed);
  selectAllValue = false;
  term = '';

  faChecked = faCheckSquare;
  faUnChecked = faSquare;
  faTrash = faTrash;
  faCheck = faCheck;
  faSync = faSyncAlt;
  faList = faList;
  faSearch = faSearch;

  constructor(
    private api: GamespaceService,
    vmSvc: VmService
  ) {
    this.source$ = merge(
      this.refresh$,
      interval(60000)
    ).pipe(
      debounceTime(500),
      switchMap(() => this.api.list('all')),
      tap(r => r.forEach(g => g.checked = !!this.selected.find(s => s.globalId === g.globalId))),
      tap(r => this.source = r),
      tap(() => this.review()),
    );

    this.vms$ = this.viewChange$.pipe(
      filter(g => !!g),
      switchMap(g => vmSvc.list(g?.globalId || ''))
    );
  }

  ngOnInit(): void {
  }

  refresh(): void {
    this.refresh$.next(true);
  }

  view(g: Gamespace): void {
    this.viewed = this.viewed !== g ? g : undefined;
    this.viewChange$.next(this.viewed);
  }

  review(): void {
    this.viewed = this.source.find(g => g.globalId === this.viewed?.globalId);
  }

  destroy(g: Gamespace): void {
    this.api.delete(g.globalId).subscribe(() => this.removeDeleted(g));
  }

  toggleAll(): void {
    this.selectAllValue = !this.selectAllValue;
    this.source.forEach(g => g.checked = this.selectAllValue);
    this.selected = this.selectAllValue
      ? this.selected = [...this.source]
      : [];
  }

  destroySelected(): void {
    [...this.selected].forEach(g => this.destroy(g));
  }

  toggle(g: Gamespace): void {

    const found = this.selected.find(f => f.globalId === g.globalId);
    if (found) {
      this.selected.splice(
        this.selected.indexOf(found),
        1
      );
    } else {
      this.selected.push(g);
    }
    g.checked = !g.checked;
  }

  private removeDeleted(g: Gamespace): void {
    const found = this.source.find(f => f.globalId === g.globalId);
    if (found) {
      this.source.splice(
        this.source.indexOf(found),
        1
      );
    }
  }

  trackById(index: number, g: Gamespace): string {
    return g.globalId;
  }
}
