// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { UntagPipe } from './untag.pipe';

describe('UntagPipe', () => {
  it('create an instance', () => {
    const pipe = new UntagPipe();
    expect(pipe).toBeTruthy();
  });
});
