import URI from '@theia/core/lib/common/uri';

export enum BuildMode {
  Release = 'Release',
  Beta = 'Beta',
  Tools = 'Tools',
  Debug = 'Debug',
}

export enum BuildResult {
  aborted = 'aborted',
  done = 'done',
  failed = 'failed',
}

export const DEFAULT_BUILD_MODE = BuildMode.Beta;

export interface BuildStatus {
  active: boolean;
  stepsTotal: number;
  stepsDone: number;
  processManagerId: number;
  processId: number;
  progress: number;
  log: BuildLogLine[];
  buildMode: BuildMode;
  step: string;
  startDate?: Date,
  endDate?: Date,
};

export interface BuildLogLineFileLink {
  uri: URI;
  line: number;
  column: number;
}

export interface BuildLogLine {
  timestamp: number;
  text: string;
  type: BuildLogLineType;
  file?: BuildLogLineFileLink;
  optimizedText?: string;
};

export interface GccMatchedProblem {
  file: string;
  line: number;
  column: number;
  severity: string;
  message: string;
}

export enum BuildLogLineType {
  Normal = 'normal',
  Headline = 'headline',
  Warning = 'warning',
  Error = 'error',
  Done = 'done',
}

export enum MemorySection {
  DYNAMIC_RAM = 'dram',
  EXPANSION_SPACE = 'exp',
  ROM = 'rom',
  STATIC_RAM = 'sram',
  WORK_RAM = 'wram',
}

export interface PrePostBuildTask {
  type: PrePostBuildTaskType
  name: string
}

export enum PrePostBuildTaskType {
  Task = 'task',
  Command = 'command',
}
