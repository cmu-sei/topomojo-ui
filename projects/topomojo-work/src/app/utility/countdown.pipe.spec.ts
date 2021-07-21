// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { CountdownPipe } from './countdown.pipe';

describe('CountdownPipe', () => {
  it('create an instance', () => {
    const pipe = new CountdownPipe();
    expect(pipe).toBeTruthy();
  });
});
