// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import { readHardware, writeHardware } from './template-hardware';

const legacy = JSON.stringify({
  Name: 'win11',
  GuestSettings: [
    { Key: 'firmware', Value: 'efi' },
    { Key: 'vhv.enable', Value: 'TRUE' },
    { Key: 'guestinfo.keep', Value: 'me' }
  ]
});

describe('template hardware settings', () => {
  it('defaults to BIOS without nested virtualization', () => {
    expect(readHardware('{}')).toEqual({ firmware: 'bios', nestedVirtualization: false });
    expect(readHardware('')).toEqual({ firmware: 'bios', nestedVirtualization: false });
  });

  it('reads legacy GuestSettings entries', () => {
    expect(readHardware(legacy)).toEqual({ firmware: 'efi', nestedVirtualization: true });
  });

  it('lets top-level settings win over legacy entries', () => {
    const detail = JSON.stringify({ ...JSON.parse(legacy), Firmware: 'bios', NestedVirtualization: false });
    expect(readHardware(detail)).toEqual({ firmware: 'bios', nestedVirtualization: false });
  });

  it('reads top-level settings case-insensitively', () => {
    expect(readHardware('{ "firmware": "EFI", "nestedvirtualization": true }'))
      .toEqual({ firmware: 'efi', nestedVirtualization: true });
  });

  // The Guest Settings box prefixes keys, and the API never honored guestinfo.firmware.
  it('ignores guestinfo.firmware', () => {
    const detail = '{ "GuestSettings": [ { "Key": "guestinfo.firmware", "Value": "efi" } ] }';
    expect(readHardware(detail)?.firmware).toBe('bios');
  });

  it('returns null for invalid JSON', () => {
    expect(readHardware('{ not json')).toBeNull();
  });

  it('writes a setting and drops only its legacy entry', () => {
    const out = JSON.parse(writeHardware(legacy, 'firmware', 'efi'));

    expect(out.Firmware).toBe('efi');
    expect(out.Name).toBe('win11');
    expect(out.GuestSettings).toEqual([
      { Key: 'vhv.enable', Value: 'TRUE' },
      { Key: 'guestinfo.keep', Value: 'me' }
    ]);
  });

  it('writes nested virtualization and drops its legacy entry', () => {
    const out = JSON.parse(writeHardware(legacy, 'nestedVirtualization', false));

    expect(out.NestedVirtualization).toBeFalse();
    expect(out.GuestSettings.map((s: any) => s.Key)).toEqual(['firmware', 'guestinfo.keep']);
  });

  it('reuses an existing key instead of adding a second casing', () => {
    const out = JSON.parse(writeHardware('{ "firmware": "bios" }', 'firmware', 'efi'));

    expect(out).toEqual({ firmware: 'efi' });
  });

  it('throws on invalid JSON', () => {
    expect(() => writeHardware('{ not json', 'firmware', 'efi')).toThrow();
  });
});
