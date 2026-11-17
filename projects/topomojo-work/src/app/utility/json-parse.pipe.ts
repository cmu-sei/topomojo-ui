// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'jsonParse',
    standalone: false
})
export class JsonParsePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): any {
    return JSON.parse(value);
  }

}
