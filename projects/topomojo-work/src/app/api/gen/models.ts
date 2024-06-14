// Copyright 2021 Carnegie Mellon University.
// Released under a 3 Clause BSD-style license. See LICENSE.md in the project root.

export interface AppVersionInfo {
  commit: string;
}

export interface Search {
  term: string;
  skip?: number;
  take?: number;
  sort?: string;
  filter?: string[];
}

// #################################
// ## GAMESPACE Models
// #################################

export interface Gamespace {
  id: string;
  managerId: string;
  managerName: string;
  audience: string;
  name: string;
  slug: string;
  whenCreated: Date;
  startTime: Date;
  endTime: Date;
  expirationTime: Date;
  players?: Player[];
  isActive: boolean;
  checked: boolean;
  session: TimeWindow;
  gameOver: boolean;
}

export interface Player {
  gamespaceId: string;
  subjectId: number;
  subjectName: string;
  permission: string;
  isManager: boolean;
}

export interface GameState {
  id: string;
  name: string;
  slug: string;
  audience: string;
  managerId: string;
  managerName: string;
  markdown?: string;
  launchpointUrl?: string;
  whenCreated: Date;
  startTime: Date;
  endTime: Date;
  expirationTime: Date;
  isActive: boolean;
  players: Player[];
  vms: VmState[];
  challenge?: ChallengeView;
  session: TimeWindow;
  gameOver: boolean;
}

export interface GamespaceRegistration {
  resourceId: string;
  variant?: number;
  maxAttempts?: number;
  maxMinutes?: number;
  points?: number;
  allowReset?: boolean;
  allowPreview?: boolean;
  startGamespace?: boolean;
  players?: RegistrationPlayer[];
}

export interface RegistrationPlayer {
  subjectId: string;
  subjectName?: string;
}

// #################################
// ## USER Models
// #################################

export interface ApiUser {
  id: string;
  name: string;
  scope: string;
  role: string;
  isAdmin: boolean;
  isObserver: boolean;
  isCreator: boolean;
  isBuilder: boolean;
  workspaceLimit: number;
  gamespaceLimit: number;
  gamespaceMaxMinutes: number;
  gamespaceCleanupGraceMinutes: number;
  whenCreated: string;
  apiKeys: ApiKey[];
}

export interface UserRegistration {
  sub: string;
  name: string;
}

export interface ChangedUser {
  id?: string;
  name?: string;
  scope?: string;
  role?: string;
  workspaceLimit?: number;
  gamespaceLimit?: number;
  gamespaceMaxMinutes?: number;
  gamespaceCleanupGraceMinutes?: number;
}

export interface ApiKeyResult {
  value: string;
}

export interface ApiKey {
  id: string;
  name: string;
  whenCreated: string;
}

export interface UserSearch extends Search {
  scope: string;
}

// #################################
// ## TEMPLATE Models
// #################################

export interface TemplateSummary {
  id: string;
  name: string;
  description?: string;
  audience?: string;
  workspaceId: string;
  workspaceName?: string;
  parentId?: string;
  parentName?: string;
  isPublished?: boolean;
  isLinked?: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  audience: string;
  networks: string;
  iso: string;
  guestinfo: string;
  parentId: string;
  parentName?: string;
  workspaceId: string;
  workspaceName?: string;
  replicas: number;
  variant: number;
  isHidden: boolean;
  isLinked: boolean;
}

export interface ChangedTemplate {
  id: string;
  name?: string;
  description?: string;
  networks?: string;
  iso?: string;
  guestinfo?: string;
  replicas?: number;
  variant: number;
  isHidden?: boolean;
}

export interface TemplateLink {
  templateId: string;
  workspaceId: string;
}
export interface TemplateReLink {
  templateId: string;
  parentId: string;
  workspaceId: string;
}

export interface TemplateClone {
  id: string;
  name?: string;
}

export interface TemplateDetail {
  id: string;
  name?: string;
  description?: string;
  audience?: string;
  networks?: string;
  guestinfo?: string;
  detail?: string;
  isPublished?: boolean;
  isLinked?: boolean;
  parent?: TemplateDetail;
}

export interface ChangedTemplateDetail {
  id: string;
  name?: string;
  description?: string;
  audience?: string;
  networks?: string;
  guestinfo?: string;
  detail?: string;
  isPublished?: boolean;
}

export interface TemplateSearch extends Search {
  aud?: string;
  pid?: string;
}

// #################################
// ## WORKSPACE Models
// #################################

export interface Workspace {
  id: string;
  name: string;
  description: string;
  tags: string;
  author: string;
  audience: string;
  whenCreated?: string;
  templateScope: string;
  templateLimit?: number;
  durationMinutes?: number;
  challenge?: string;
  workers?: Worker[];
  templates?: Template[];
  stats: WorkspaceStats;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  description: string;
  author: string;
  audience: string;
  whenCreated: string;
}

export interface PlayableWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string;

  expirationTime: string;
}

export interface NewWorkspace {
  name?: string;
  description?: string;
  tags?: string;
  author?: string;
  audience?: string;
  challenge?: string;
  document?: string;
  templateScope?: string;
  templateLimit?: number;
}

export interface ChangedWorkspace {
  id: string;
  name?: string;
  description?: string;
  tags?: string;
  author?: string;
  audience?: string;
  templateScope?: string;
  templateLimit?: number;
  durationMinutes?: number;
}

export interface JoinCode {
  id: string;
  code: string;
}

export interface WorkspaceSearch extends Search {
  aud?: string;
}

export interface Worker {
  workspaceId: string;
  subjectId: string;
  subjectName?: string;
  permission?: string;
  canManage?: boolean;
  canEdit?: boolean;
}

export interface WorkspaceStats {
  id: string;
  activeGamespaceCount: number;
  launchCount: number;
  lastActivity: string;
}
// #################################
// ## VM Models
// #################################

export interface VmState {
  id: string;
  name: string;
  isolationId: string;
  isRunning: boolean;
}

export interface VmOptions {
  iso?: string[];
  net?: string[];
}

export interface VmConsole {
  id: string;
  isolationId: string;
  name: string;
  isRunning: boolean;
  url: string;
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
  hypervisorType?: HypervisorTypeEnum;
}

export interface VmQuestion {
  id: string;
  prompt: string;
  defaultChoice: string;
  choices: VmQuestionChoice[];
}

export interface VmTask {
  id: string;
  name: string;
  progress: number;
  whenCreated: string;
}

export interface VmQuestionChoice {
  key: string;
  label: string;
}

export interface VmOperation {
  id: string;
  type: string | VmOperationTypeEnum;
}

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface VmAnswer {
  questionId: string;
  choiceKey: string;
}

export enum VmStateEnum {
  off = 'off',
  running = 'running',
  suspended = 'suspended',
}

export enum VmOperationTypeEnum {
  start = 'start',
  stop = 'stop',
  save = 'save',
  revert = 'revert',
  delete = 'delete',
}

export enum HypervisorTypeEnum {
  vsphere = 'vsphere',
  proxmox = 'proxmox',
}

// #################################
// ## ADMIN Models
// #################################

export interface JanitorReport {
  id?: string;
  name?: string;
  reason?: string;
  age?: string;
}

export interface CachedConnection {
  id: string;
  room?: string;
  profileId?: string;
  profileName?: string;
}

// #################################
// ## Challenge Models
// #################################

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
  hidden?: boolean;
}

export interface ChallengeView {
  isActive: boolean;
  text: string;
  maxPoints: number;
  maxAttempts: number;
  attempts: number;
  score: number;
  sectionText: string;
  sectionCount: number;
  sectionIndex: number;
  sectionScore: number;
  questions: QuestionView[];
}

export interface QuestionView {
  text: string;
  hint: string;
  answer: string;
  example: string;
  weight: number;
  penalty: number;
  isCorrect: boolean;
  isGraded: boolean;
}

export interface SectionSubmission {
  id: string;
  sectionIndex: number;
  questions: AnswerSubmission[];
}

export interface AnswerSubmission {
  answer: string;
}

// #################################
// ## FILEUPLOAD Models
// #################################

export interface IsoFile {
  path: string;
  display: string;
}

export interface IsoDataFilter {
  term?: string;
  refresh?: boolean;
  local?: boolean;
}

export interface ImageFile {
  filename: string;
  url: string;
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

// #################################
// ## DISPATCH Models
// #################################
export interface Dispatch {
  id: string;
  trigger: string;
  targetGroup: string;
  targetName: string;
  result: string;
  error: string;
  whenCreated: Date;
  whenUpdated: Date;
}

export interface ChangedDispatch {
  id: string;
  result: string;
  error: string;
}

export interface NewDispatch {
  referenceId: string;
  trigger: string;
  targetGroup: string;
  targetName: string;
}

export interface DispatchSearch extends Search {
  gs?: string;
  since?: string;
}
