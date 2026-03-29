import { nls } from '@theia/core';
import URI from '@theia/core/lib/common/uri';

export enum BuildMode {
  Shipping = 'Shipping',
  Release = 'Release',
  Beta = 'Beta',
  Tools = 'Tools',
  Debug = 'Debug',
}

export const BUILD_MODE_DESCRIPTIONS: Record<BuildMode, string> = {
  [BuildMode.Shipping]: nls.localize('vuengine/build/modes/shippingDescription', 'Includes no asserts or debug flags, for shipping only.'),
  [BuildMode.Release]: nls.localize('vuengine/build/modes/releaseDescription', 'Includes no asserts or debug flags, for testing on hardware.'),
  [BuildMode.Beta]: nls.localize('vuengine/build/modes/betaDescription', 'Includes selected asserts, for testing on emulators.'),
  [BuildMode.Tools]: nls.localize('vuengine/build/modes/toolsDescription', 'Includes selected asserts, includes debugging tools.'),
  [BuildMode.Debug]: nls.localize('vuengine/build/modes/debugDescription', 'Includes all runtime assertions, includes debugging tools.'),
};

export enum BuildResult {
  aborted = 'aborted',
  done = 'done',
  failed = 'failed',
}

export enum BuildArchiveFrequency {
  ALL = 'all',
  DAY = 'day',
  HOUR = 'hour',
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

export const WSL_ENGINE_BASE_PATH = '~/vuengine/';
export const WSL_ENGINE_CORE_PATH = WSL_ENGINE_BASE_PATH + 'core/';
export const WSL_ENGINE_PLATFORMS_PATH = WSL_ENGINE_BASE_PATH + 'platforms/';
export const WSL_ENGINE_PLUGINS_PATH = WSL_ENGINE_BASE_PATH + 'plugins/';
export const WSL_USER_PLUGINS_PATH = WSL_ENGINE_BASE_PATH + 'user/';
export const WSL_PROJECTS_PATH = WSL_ENGINE_BASE_PATH + 'projects/';
