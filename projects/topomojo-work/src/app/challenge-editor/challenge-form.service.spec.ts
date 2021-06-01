// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { TestBed } from '@angular/core/testing';

import { ChallengeFormService } from './challenge-form.service';

describe('ChallengeFormService', () => {
  let service: ChallengeFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChallengeFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
