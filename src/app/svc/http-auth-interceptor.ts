// Copyright 2020 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import {Injectable, Injector} from '@angular/core';
import {HttpEvent, HttpInterceptor, HttpHandler, HttpRequest} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private injector: Injector
    ) {}
    private auth: AuthService;

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (req.url.match(/assets/)) {
            return next.handle(req);
        }

        // this.auth = this.injector.get(AuthService);
        // const authHeader = this.auth.auth_header();
        // const authReq = req.clone({setHeaders: {Authorization: this.injector.get(AuthService).auth_header()}});
        return next.handle(
            req.clone({setHeaders: {
                Authorization: this.injector.get(AuthService).auth_header()
            }})
        );
    }
}
