// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { PlatformLocation } from '@angular/common';
import { Injectable } from '@angular/core';
import { ConfigService } from '../config.service';

@Injectable()
export class ApiSettings {

  api: string;
  docs: string;

  constructor(
      config: ConfigService
  ) {
      this.api = `${config.apihost}api`;
      this.docs = `${config.apihost}docs`;
  }

}
