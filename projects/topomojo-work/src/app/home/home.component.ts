// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiUser } from '../api/gen/models';
import { ConfigService } from '../config.service';
import { UserService } from '../user.service';
import { faBolt, faChevronLeft, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  appname: string | undefined;

  user$!: Observable<ApiUser | null>;
  user!: ApiUser | null;

  faPlus = faPlus;
  faSearch = faSearch;
  faChevronLeft = faChevronLeft;
  faBolt = faBolt;

  constructor(
    private config: ConfigService,
    private userSvc: UserService,
    private router: Router
  ) {
    this.appname = config.settings.appname;

    this.userSvc.user$.asObservable().subscribe(
      u => this.user = u
    );
  }

  ngOnInit(): void {
    const url = this.config.lastUrl;
    if (!!url) {
      this.router.navigateByUrl(url);
    }
  }

  openSidebar(): void {
    this.config.sidebar$.next(true);
  }

}
