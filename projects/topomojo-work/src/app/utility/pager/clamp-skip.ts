// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

/**
 * The page start to use after the list changed under the pager: unchanged while it still lands on a
 * row, otherwise the start of the last page (or 0 when the list is empty).
 */
export function clampSkip(skip: number, total: number, take: number): number {
  if (total <= 0 || skip <= 0) {
    return 0;
  }

  return skip < total ? skip : Math.floor((total - 1) / take) * take;
}
