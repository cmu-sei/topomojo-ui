// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'ago'})
export class AgedDatePipe implements PipeTransform {
    transform(date: any): string {
        let r = '';
        const n = new Date();
        const t = new Date(date); // + " GMT");
        const tag = [ 's', 'm', 'h', 'd' ];
        // console.log(date);
        // console.log(n);
        // console.log(t);
        let d: number = n.valueOf() - t.valueOf();
        const a: number[] = [
            d / 1000,
            d / 1000 / 60,
            d / 1000 / 60 / 60,
            d / 1000 / 60 / 60 / 24
        ];
        for (let i = 0; i < a.length; i++) {
            d = Math.floor(a[i]);
            if (!!d) {
                r = d + tag[i];
            }
        }
        // console.log(a);
        return r + ' ago';
    }
}
