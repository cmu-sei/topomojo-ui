// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { TestBed } from '@angular/core/testing';

import { ChallengeEditService } from './challenge-edit.service';

describe('ChallengeEditService', () => {
  let service: ChallengeEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChallengeEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
