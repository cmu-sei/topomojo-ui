// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { CamelspacePipe } from './camelspace.pipe';

describe('CamelspacePipe', () => {
  it('create an instance', () => {
    const pipe = new CamelspacePipe();
    expect(pipe).toBeTruthy();
  });
});
