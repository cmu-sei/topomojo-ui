// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
    selector: 'app-oidc',
    templateUrl: './oidc.component.html',
    styleUrls: ['./oidc.component.scss'],
    standalone: false
})
export class OidcComponent implements OnInit {
  message = '';

  constructor(
    auth: AuthService,
    router: Router
  ) {
    auth.externalLoginCallback().then(
      (user) => {
        router.navigateByUrl(""+user.state || '/');
      },
      (err) => {
        console.log(err);
        this.message = (err.error || err).message;
      }
    );
  }

  ngOnInit(): void {
  }

}
