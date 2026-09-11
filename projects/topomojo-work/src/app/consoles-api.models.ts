// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

import type * as Api from './api/gen/models';
export type { VmActivity } from './api/gen/models';
export { VmStateEnum, VmOperationTypeEnum } from './api/gen/models';

export interface ConsoleRequest {
    name?: string;
    sessionId?: string;
    token?: string;
}

export interface ConsolePresence {
    name?: string;
    sessionId?: string;
    username?: string;
}

// Preserve the console client's compatibility with responses lacking isRunning.
export type ConsoleSummary = Omit<Api.VmConsole, 'isRunning'> & Partial<Pick<Api.VmConsole, 'isRunning'>>;

// Console operations accept only known operation types, and options require both lists.
export type VmOperation = Omit<Api.VmOperation, 'type'> & { type: Api.VmOperationTypeEnum };
export type VmOptions = Required<Api.VmOptions>;

// These console models historically allow partial values.
export type VmQuestion = Omit<Partial<Api.VmQuestion>, 'choices'> & { choices?: VmQuestionChoice[] };
export type VmQuestionChoice = Partial<Api.VmQuestionChoice>;
export type VmTask = Partial<Api.VmTask>;
export type KeyValuePair = Partial<Api.KeyValuePair>;
export type VmAnswer = Partial<Api.VmAnswer>;
