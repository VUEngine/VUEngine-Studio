export enum BuildMode {
  Release = "Release",
  Beta = "Beta",
  Tools = "Tools",
  Debug = "Debug",
  Preprocessor = "Preprocessor"
}

export const DEFAULT_BUILD_MODE = BuildMode.Beta;

export type BuildStatus = {
  active: boolean
  processManagerId: number
  processId: number
  progress: number
  log: BuildLogLine[]
  buildMode: BuildMode
  step: string
}

export type BuildLogLine = {
  timestamp: number
  text: string
  type: BuildLogLineType
}

export enum BuildLogLineType {
  Normal = "normal",
  Headline = "headline",
  Warning = "warning",
  Error = "error",
}