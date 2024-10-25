// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { faOpenid } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  authority: string | undefined;
  faOpenid = faOpenid;
  working = false;

  constructor(
    private auth: AuthService
  ) {
    this.authority = auth.authority;
  }

  ngOnInit(): void {
    if (this.auth.autoLogin()) {
      this.working = true;
    }
  }

  login(): void {
    this.working = true;
    this.auth.externalLogin();
  }

}
