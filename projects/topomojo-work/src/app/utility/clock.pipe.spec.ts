// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { ClockPipe } from './clock.pipe';

describe('ClockPipe', () => {
  it('create an instance', () => {
    const pipe = new ClockPipe();
    expect(pipe).toBeTruthy();
  });
});
