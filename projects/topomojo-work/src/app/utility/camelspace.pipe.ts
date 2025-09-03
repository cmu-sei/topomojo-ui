// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'camelspace',
    standalone: false
})
export class CamelspacePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): unknown {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  }

}
