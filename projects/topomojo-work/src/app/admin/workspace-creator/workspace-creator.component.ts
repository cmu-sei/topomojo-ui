import { Component } from '@angular/core';
import { concat, concatAll, concatMap, merge, Observable, Subject, switchMap, tap } from 'rxjs';
import { NewWorkspace, Workspace } from '../../api/gen/models';
import { WorkspaceService } from '../../api/workspace.service';

@Component({
  selector: 'app-workspace-creator',
  templateUrl: './workspace-creator.component.html',
  styleUrls: ['./workspace-creator.component.scss']
})
export class WorkspaceCreatorComponent {
  creating$ = new Subject<NewWorkspace>();
  created$: Observable<Workspace>;
  created: Workspace[] = [];
  model: NewWorkspace = {};
  count = 1;

  constructor(
    svc: WorkspaceService
  ){
    this.created$ = this.creating$.pipe(
      concatMap(m => svc.create(m)),
      tap(w => this.created.push(w))
    );
  }

  create(): void {
    if (this.count < 1) { return; }

    for (let i = 1; i < this.count+1; i++) {
      const model = {...this.model};
      if (this.count > 1) {
        model.name += " " + i;
      }
      this.creating$.next(model);
    }
  }
}
