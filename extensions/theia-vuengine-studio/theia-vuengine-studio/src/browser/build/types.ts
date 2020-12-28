export enum BuildMode {
  release = "release",
  beta = "beta",
  tools = "tools",
  debug = "debug",
  preprocessor = "preprocessor"
}

export const DEFAULT_BUILD_MODE = BuildMode.beta;
