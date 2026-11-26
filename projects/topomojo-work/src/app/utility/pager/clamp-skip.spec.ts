// Copyright 2026 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { clampSkip } from './clamp-skip';

describe('clampSkip', () => {
  it('keeps a page start that still lands on a row', () => {
    expect(clampSkip(0, 250, 100)).toBe(0);
    expect(clampSkip(100, 250, 100)).toBe(100);
    expect(clampSkip(200, 250, 100)).toBe(200);
  });

  it('moves a page start past the end back to the start of the last page', () => {
    expect(clampSkip(200, 150, 100)).toBe(100);
    expect(clampSkip(300, 200, 100)).toBe(100);
    expect(clampSkip(100, 100, 100)).toBe(0);
  });

  it('is 0 for an empty list or a negative start', () => {
    expect(clampSkip(200, 0, 100)).toBe(0);
    expect(clampSkip(-5, 50, 100)).toBe(0);
  });
});
