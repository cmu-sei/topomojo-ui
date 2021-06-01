// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spaces'
})
export class SpacesPipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }

}
