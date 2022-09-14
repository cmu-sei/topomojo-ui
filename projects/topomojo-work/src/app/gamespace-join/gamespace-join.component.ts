import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap } from 'rxjs/operators';
import { GamespaceService } from '../api/gamespace.service';

@Component({
  selector: 'app-gamespace-join',
  templateUrl: './gamespace-join.component.html',
  styleUrls: ['./gamespace-join.component.scss']
})
export class GamespaceJoinComponent implements OnInit {

  message = '';
  slug = '';
  id = '';

  constructor(
    route: ActivatedRoute,
    router: Router,
    api: GamespaceService
  ) {
    route.params.pipe(
      tap(p => {
        this.id = p.id;
        this.slug = p.slug;
      }),
      switchMap(p => api.createPlayer(p.code))
    ).subscribe(
      () => router.navigate(['/mojo', this.id, this.slug]),
      err => this.message = 'Invalid invitation code.'
    );
  }

  ngOnInit(): void {
  }

}
