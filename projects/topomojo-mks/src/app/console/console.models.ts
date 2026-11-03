// Copyright 2026 Carnegie Mellon University. All Rights Reserved.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root for license information.

export interface ConsoleSupportsFeatures {
    autoCopyVmSelection: boolean;
    virtualKeyboard: boolean;
    pasteToClipboard: boolean;
}

export interface ConsoleOptions {
    canvasId: string;
    changeResolution: boolean;
    ticket: string;
    viewOnly: boolean;
}
