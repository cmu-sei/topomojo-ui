// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

export interface LaunchParams {
  token: string;
  gid: string;
}
export interface TabRef {
  url: string;
  window: Window | null;
}
export interface GameState {
  id?: string;
  name?: string;
  whenCreated?: Date;
  startTime: Date;
  endTime: Date;
  expirationTime: Date;
  markdown?: string;
  players?: Array<Player>;
  vms?: Array<VmState>;
  error?: string;
  isBefore: boolean;
  isDuring: boolean;
  isAfter: boolean;
  window: number;
  countdown: number;
}

export interface VmState {
  id?: string;
  name?: string;
  isolationId?: string;
  isRunning?: boolean;
}

export interface Player {
  id?: number;
  personId?: number;
  personName?: string;
  personGlobalId?: string;
  canManage?: boolean;
  canEdit?: boolean;
}

export class TimeWindow {
  isBefore: boolean;
  isDuring: boolean;
  isAfter: boolean;
  window: number;
  countdown: number;

  constructor(a: Date, b: Date) {
    const ts = new Date().valueOf();
    const start = new Date(a).valueOf();
    const end = new Date(b).valueOf();
    this.window = start > 0 && ts >= start ? end > 0 && ts > end ? 1 : 0 : -1;
    this.isBefore = this.window < 0;
    this.isDuring = this.window === 0;
    this.isAfter = this.window > 0;
    this.countdown = this.isBefore && start > 0
      ? start - ts
      : this.isDuring && end > 0
        ? end - ts
        : 0
    ;
  }
}

export interface ConsoleSummary {
  id?: string;
  isolationId?: string;
  name?: string;
  url?: string;
  isRunning?: boolean;
  error?: string;
}

export interface LaunchContext {
  game?: GameState;
  connection?: ConsoleSummary;
}


export interface Vm {
  id?: string;
  name?: string;
  host?: string;
  path?: string;
  reference?: string;
  diskPath?: string;
  stats?: string;
  status?: string;
  groupName?: string;
  state?: VmStateEnum;
  question?: VmQuestion;
  task?: VmTask;
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

export interface VmOperation {
  id?: string;
  type?: VmOperationTypeEnum;
  workspaceId?: number;
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
  off = 'off' as any,
  running = 'running' as any,
  suspended = 'suspended' as any
}

export enum VmOperationTypeEnum {
  start = 'start' as any,
  stop = 'stop' as any,
  save = 'save' as any,
  revert = 'revert' as any,
  delete = 'delete' as any
}
