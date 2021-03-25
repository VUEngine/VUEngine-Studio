export enum BuildMode {
  Release = "Release",
  Beta = "Beta",
  Tools = "Tools",
  Debug = "Debug",
  Preprocessor = "Preprocessor"
}

export const DEFAULT_BUILD_MODE = BuildMode.Beta;

export type buildStatus = {
  active: boolean
  processId: number
  progress: number
  log: BuildLog
}

export type BuildLog = {
  startTimestamp: number,
  log: BuildLogLine[],
}

export type BuildLogLine = {
  timestamp: number,
  text: string,
}