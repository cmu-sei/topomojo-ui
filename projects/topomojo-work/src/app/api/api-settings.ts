// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';

@Injectable()
export class ApiSettings {

  constructor(
      private config: ConfigService
  ) {}

  get api(): string {
      return `${this.config.apphost}api`;
  }

  get docs(): string {
      return `${this.config.apphost}docs`;
  }

}
