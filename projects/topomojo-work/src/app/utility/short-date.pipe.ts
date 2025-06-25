// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'shortdate',
    standalone: false
})
export class ShortDatePipe implements PipeTransform {
    transform(date: any): string {
        const t = new Date(date);
        return t.toLocaleDateString();
        // return t.toLocaleString('en-us', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit'});
    }
}
