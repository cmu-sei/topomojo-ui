import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, tap } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  section = 'dashboard';

  constructor(
    route: ActivatedRoute
  ) {
    route.params.pipe(
      debounceTime(500),
      tap(p => this.section = p.section)
    ).subscribe();
  }

  ngOnInit(): void {
  }

}
