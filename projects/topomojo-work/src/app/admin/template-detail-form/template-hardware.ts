// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

// Firmware and nested virtualization live at the top level of a template's Detail JSON.
// Older templates set them as GuestSettings entries ("firmware=efi", "vhv.enable=true"),
// which the API still honors when the top-level setting is absent.

export type Firmware = 'bios' | 'efi';

export interface TemplateHardware {
  firmware: Firmware;
  nestedVirtualization: boolean;
}

interface KeyValue { key: string; value: string; }

// The API reads Detail case-insensitively and writes PascalCase.
function findKey(obj: any, name: string): string | undefined {
  return Object.keys(obj).find(k => k.toLowerCase() === name.toLowerCase());
}

function toKeyValue(s: any): KeyValue {
  if (!s || typeof s !== 'object') { return { key: '', value: '' }; }
  return {
    key: '' + (s[findKey(s, 'Key') ?? 'Key'] ?? ''),
    value: '' + (s[findKey(s, 'Value') ?? 'Value'] ?? '')
  };
}

function guestSettings(obj: any): KeyValue[] {
  const key = findKey(obj, 'GuestSettings');
  const list = key ? obj[key] : null;
  return Array.isArray(list) ? list.map(toKeyValue) : [];
}

const isLegacyFirmware = (s: KeyValue) => s.key === 'firmware';
const isLegacyVhv = (s: KeyValue) => s.key.includes('vhv.enable');

/** What the template deploys with on vSphere, mirroring the API's precedence. Null if detail isn't valid JSON. */
export function readHardware(detail: string | undefined | null): TemplateHardware | null {
  let obj: any;
  try {
    obj = JSON.parse(detail || '{}');
  } catch {
    return null;
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { return null; }

  const settings = guestSettings(obj);

  const fwKey = findKey(obj, 'Firmware');
  const fw = fwKey ? ('' + (obj[fwKey] ?? '')).trim().toLowerCase() : '';
  const firmware: Firmware = fwKey && fw
    ? (fw === 'efi' ? 'efi' : 'bios')
    : (settings.some(s => isLegacyFirmware(s) && s.value === 'efi') ? 'efi' : 'bios');

  const nvKey = findKey(obj, 'NestedVirtualization');
  const nestedVirtualization = nvKey && typeof obj[nvKey] === 'boolean'
    ? obj[nvKey] as boolean
    : settings.some(s => isLegacyVhv(s) && s.value.toLowerCase() === 'true');

  return { firmware, nestedVirtualization };
}

/**
 * Writes one top-level setting into detail and drops the matching legacy GuestSettings entry,
 * so the setting is recorded in one place. Throws if detail isn't valid JSON.
 */
export function writeHardware<K extends keyof TemplateHardware>(
  detail: string | undefined | null, setting: K, value: TemplateHardware[K]
): string {
  const obj = JSON.parse(detail || '{}');

  const name = setting === 'firmware' ? 'Firmware' : 'NestedVirtualization';
  obj[findKey(obj, name) ?? name] = value;

  const gsKey = findKey(obj, 'GuestSettings');
  if (gsKey && Array.isArray(obj[gsKey])) {
    const isLegacy = setting === 'firmware' ? isLegacyFirmware : isLegacyVhv;
    obj[gsKey] = obj[gsKey].filter((s: any) => !isLegacy(toKeyValue(s)));
  }

  return JSON.stringify(obj, null, 2);
}
