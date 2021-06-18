// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.


export interface CachedConnection {
    id: string;
    room?: string;
    profileId?: string;
    profileName?: string;
}

export interface Message {
    id?: number;
    roomId?: string;
    authorName?: string;
    text?: string;
    whenCreated?: string;
    edited?: boolean;
}

export interface NewMessage {
    roomId?: string;
    text?: string;
}

export interface ChangedMessage {
    id?: number;
    text?: string;
}

export interface ImageFile {
    filename?: string;
    url?: string;
}

export interface Gamespace {
    id: number;
    globalId: string;
    name?: string;
    slug?: string;
    clientId?: string;
    audience?: string;
    whenCreated?: string;
    workspaceDocument?: string;
    workspaceId?: number;
    players?: Array<Player>;
    checked: boolean;
}

export interface Player {
    id?: number;
    personId?: number;
    personName?: string;
    personGlobalId?: string;
    canManage?: boolean;
    canEdit?: boolean;
}

export interface GameState {
    id?: number;
    name?: string;
    globalId: string;
    audience?: string;
    whenCreated?: string;
    workspaceDocument?: string;
    markdown?: string;
    shareCode?: string;
    launchpointUrl?: string;
    startTime: string;
    stopTime: string;
    expirationTime: string;
    isActive?: boolean;
    players?: Array<Player>;
    vms?: Array<VmState>;
    challenge?: ChallengeView;
}

export interface VmState {
    id: string;
    templateId: number;
    name: string;
    isRunning: boolean;
}

export interface Search {
    term?: string;
    skip?: number;
    take?: number;
    sort?: string;
    filter?: Array<string>;
}

export interface UserProfile {
    id: number;
    globalId: string;
    name?: string;
    role?: string;
    isAdmin?: boolean;
    workspaceLimit?: number;
    whenCreated?: string;
}

export interface UserRegistration {
  globalId?: string;
}

export interface ChangedUser {
    globalId?: string;
    name?: string;
}

export interface TemplateSummary {
    id: number;
    globalId: string;
    name?: string;
    description?: string;
    workspaceId?: number;
    workspaceGlobalId: string;
    workspaceName?: string;
    parentId?: string;
    parentName?: string;
    isPublished?: boolean;
}

export interface Template {
    id: number;
    globalId: string;
    parentId?: number;
    name?: string;
    description?: string;
    networks?: string;
    iso?: string;
    guestinfo?: string;
    replicas?: number;
    isHidden?: boolean;
    workspaceGlobalId: string;
}

export interface ChangedTemplate {
    globalId: string;
    name?: string;
    description?: string;
    networks?: string;
    iso?: string;
    guestinfo?: string;
    replicas?: number;
    isHidden?: boolean;
}

export interface TemplateLink {
    templateId: string;
    workspaceId: string;
}

export interface TemplateDetail {
    globalId: string;
    name?: string;
    description?: string;
    networks?: string;
    guestinfo?: string;
    detail?: string;
    isPublished?: boolean;
}

export interface WorkspaceSummary {
    id: number;
    globalId: string;
    name: string;
    slug: string;
    description: string;
    canManage: boolean;
    canEdit: boolean;
    isPublished: boolean;
    author: string;
    audience: string;
    whenCreated: string;
}

export interface Workspace {
    id: number;
    globalId: string;
    name: string;
    slug: string;
    description: string;
    documentUrl?: string;
    shareCode?: string;
    author: string;
    audience: string;
    whenCreated?: string;
    canManage: boolean;
    canEdit: boolean;
    templateLimit?: number;
    isPublished: boolean;
    gamespaceCount?: number;
    challenge?: string;
    workers?: Array<Worker>;
    templates?: Array<Template>;
}

export interface Worker {
    id: number;
    personName?: string;
    personGlobalId?: string;
    canManage?: boolean;
    canEdit?: boolean;
}

export interface NewWorkspace {
    name?: string;
    description?: string;
}

export interface ChangedWorkspace {
    globalId?: string;
    name?: string;
    description?: string;
    author?: string;
    audience?: string;
    isPublished?: boolean;
    documentUrl?: string;
    templateLimit?: number;
}

export interface WorkspaceState {
    id?: number;
    shareCode?: string;
}

export interface VmOptions {
    iso?: Array<string>;
    net?: Array<string>;
}

export interface ConsoleSummary {
    id?: string;
    isolationId?: string;
    name?: string;
    url?: string;
    isRunning?: boolean;
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
    type?: string | VmOperationTypeEnum;
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

export interface JanitorReport {
  id?: number;
  name?: string;
  reason?: string;
  age?: string;
}

export interface ChallengeSpec {
  text?: string;
  transforms?: KeyValuePair[];
  customizeScript?: CustomSpec;
  gradeScript?: CustomSpec;
  variants?: VariantSpec[];
}

export interface CustomSpec {
  image?: string;
  script?: string;
}

export interface VariantSpec {
  text?: string;
  iso?: IsoSpec;
  sections?: SectionSpec[];
}

export interface IsoSpec {
  file?: string;
  manifest?: string[];
  targets?: string;
  downloadable?: boolean;
}

export interface SectionSpec {
  text?: string;
  prerequisite?: number;
  questions?: QuestionSpec[];
}

export interface QuestionSpec {
  text?: string;
  hint?: string;
  answer?: string;
  example?: string;
  grader?: string;
  weight?: number;
  penalty?: number;
}

export interface ChallengeView {
  isActive: boolean;
  text?: string;
  maxPoints: number;
  maxAttempts: number;
  attempts: number;
  score?: number;
  sectionText?: string;
  sectionCount?: number;
  sectionIndex?: number;
  sectionScore?: number;
  questions?: QuestionView[];
}

export interface QuestionView {
  text?: string;
  hint?: string;
  answer?: string;
  example?: string;
  weight: number;
  penalty?: number;
  isCorrect?: boolean;
  isGraded?: boolean;
}

export interface SectionSubmission {
  sectionIndex?: number;
  questions?: AnswerSubmission[];
}

export interface AnswerSubmission {
  answer?: string;
}

export interface NewGamespace {
  resourceId?: string;
  variant?: number;
  maxAttempts?: number;
  maxMinutes?: number;
  points?: number;
  allowReset?: boolean;
  allowPreview?: boolean;
  startGamespace?: boolean;
}

export interface IsoFile {
  path: string;
  display: string;
}
export interface IsoDataFilter {
  term?: string;
  refresh?: boolean;
  local?: boolean;
}
