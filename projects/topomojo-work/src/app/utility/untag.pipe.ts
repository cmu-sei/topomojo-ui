// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'untag'
})
export class UntagPipe implements PipeTransform {

  transform(value: string | undefined, ...args: unknown[]): string {
    if (!value) { return ''; }
    return (value.split('#').shift() || value).trim();
  }

}
