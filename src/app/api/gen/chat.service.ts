// Copyright 2020 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiSettings } from '../api-settings';
import { GeneratedService } from './_service';
import { ChangedMessage, Message, NewMessage } from './models';

@Injectable()
export class GeneratedChatService extends GeneratedService {

    constructor(
       protected http: HttpClient,
       protected api: ApiSettings
    ) { super(http, api); }

    public list(id: string, marker: number, take: number): Observable<Array<Message>> {
        return this.http.get<Array<Message>>(this.api.url + '/api/chats/' + id + this.paramify({marker: marker, take: take}));
    }
    public load(id: number): Observable<Message> {
        return this.http.get<Message>(this.api.url + '/api/chat/' + id);
    }
    public delete(id: number): Observable<any> {
        return this.http.delete<any>(this.api.url + '/api/chat/' + id);
    }
    public update(model: ChangedMessage): Observable<any> {
        return this.http.put<any>(this.api.url + '/api/chat', model);
    }
    public create(model: NewMessage): Observable<any> {
        return this.http.post<any>(this.api.url + '/api/chat', model);
    }

}
