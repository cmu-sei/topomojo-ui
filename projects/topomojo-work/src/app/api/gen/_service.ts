// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { HttpClient } from '@angular/common/http';
import { ApiSettings } from '../api-settings';

export class GeneratedService {

    constructor(
        protected http: HttpClient,
        protected conf: ApiSettings
    ) { }

    protected paramify(obj: any): string {
        const segments: Array<string> = new Array<string>();
        for (const p in obj) {
            if (obj.hasOwnProperty(p)) {
                const prop = obj[p];
                if (prop) {
                    if (Array.isArray(prop)) {
                        prop.forEach(element => {
                            segments.push(this.encodeKVP(p, element));
                        });
                    } else {
                        segments.push(this.encodeKVP(p, prop));
                    }
                }
            }
        }
        const qs = segments.join('&');
        return (qs) ? '?' + qs : '';
    }

    private encodeKVP(key: string, value: string): string {
        return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }
}
