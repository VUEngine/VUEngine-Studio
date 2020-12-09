export enum BuildMode {
    release = "release",
    beta = "beta",
    tools = "tools",
    debug = "debug",
    preprocessor = "preprocessor",
}

export async function setModeCommand(buildMode: BuildMode) {
    // TODO
    //alert(`Set build mode to ${BuildMode[buildMode]}`);
}
