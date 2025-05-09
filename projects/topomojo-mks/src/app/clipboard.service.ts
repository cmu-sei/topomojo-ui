// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Injectable } from '@angular/core';

@Injectable()
export class ClipboardService {
  constructor() {}

  copyToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }
}
