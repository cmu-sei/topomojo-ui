// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { AgedDatePipe } from './aged-date.pipe';

describe('AgedDatePipe', () => {
  it('create an instance', () => {
    const pipe = new AgedDatePipe();
    expect(pipe).toBeTruthy();
  });
});
