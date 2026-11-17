// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

export interface ConsoleRequest {
  name?: string;
  sessionId?: string;
  fullbleed?: boolean;
}

export interface ConsolePresence {
  name?: string;
  sessionId?: string;
  username?: string;
}

export interface ConsoleSummary {
  id: string;
  isolationId: string;
  name: string;
  url: string;
  ticket: string;
  isRunning?: boolean;
  error?: string;
}

export interface VmOperation {
  id: string;
  op: string;
}

export interface VmOptions {
  iso: Array<string>;
  net: Array<string>;
}

export interface VmQuestion {
  id?: string;
  prompt?: string;
  defaultChoice?: string;
  choices?: Array<VmQuestionChoice>;
}

export interface VmTask {
  id?: string;
  name?: string;
  progress?: number;
  whenCreated?: string;
}

export interface VmQuestionChoice {
  key?: string;
  label?: string;
}

export interface KeyValuePair {
  key?: string;
  value?: string;
}

export interface VmAnswer {
  questionId?: string;
  choiceKey?: string;
}

export enum VmStateEnum {
  off = 'off',
  running = 'running',
  suspended = 'suspended'
}

export enum VmOperationTypeEnum {
  start = 'start',
  stop = 'stop',
  save = 'save',
  revert = 'revert',
  delete = 'delete'
}
