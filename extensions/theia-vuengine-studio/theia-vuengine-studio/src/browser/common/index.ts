import { join as joinPath, resolve as resolvePath } from "path";
//import { existsSync, readFileSync } from "fs";
import { cpus, platform } from "os";
import { PreferenceService } from "@theia/core/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { isOSX, isWindows } from "@theia/core";

// // const terminals: { [key: string]: Terminal } = {};
// export let isWorkspaceVUEngineProject = isVUEngineProject(getWorkspaceRoot());

// export function isVUEngineProject(folder: string) {
//   return existsSync(resolvePath(folder + "/.vuengine"));
// }

function getExtensionPath() {
  return "";
}

export function getWorkspaceRoot(workspaceService: WorkspaceService): string {
  return (
    workspaceService
      .getWorkspaceRootUri(workspaceService.workspace?.resource)
      ?.path.toString() ?? ""
  );
}

export function getResourcesPath() {
  return resolvePath(joinPath(getExtensionPath(), "..", "..", "resources"));
}

export function getRomPath(workspaceService: WorkspaceService): string {
  return joinPath(getWorkspaceRoot(workspaceService), "build", "output.vb");
}

// export function parseJson(file: string) {
//   if (existsSync(file)) {
//     try {
//       return JSON.parse(readFileSync(file, "utf8"));
//     } catch (e) {
//       //logger.logError('JSON parse file', file);
//       return {};
//     }
//   } else {
//     //logger.logInfo('JSON file does not exist', file);
//     return {};
//   }
// }

// export function sortObject(object: {}, key?: string) {
//   /*
//   if (typeof object != "object" || object instanceof Array || !object) {
//     return object;
//   }
//   const keys = Object.keys(object);

//   if (key) {
//     keys.sort(function(a, b) {
//       return object[a][key] - object[b][key];
//     });
//   } else {
//     keys.sort();
//   }

//   const sortedObject = {};
//   for (let i = 0; i < keys.length; i++) {
//     sortedObject[keys[i]] = sortObject(object[keys[i]], key);
//   }

//   return sortedObject;
// */
//   return object;
// }

export function getThreads() {
  let threads = cpus().length;
  if (threads > 2) {
    threads--;
  }

  return threads;
}

export function getOs() {
  return isWindows ? "win" : isOSX ? "osx" : platform();
}

export function getEngineCorePath() {
  return joinPath(getResourcesPath(), "app", "vuengine", "vuengine-core");
}

export function getEnginePluginsPath() {
  return joinPath(getResourcesPath(), "app", "vuengine", "vuengine-plugins");
}

export function getCompilerPath() {
  return joinPath(getResourcesPath(), "app", "binaries", getOs(), "gcc");
}

export function getMsysPath() {
  return joinPath(getResourcesPath(), "app", "binaries", "win", "msys");
}

// // export function getTerminal(
// //   preferenceService: PreferenceService,
// //   terminalName: string,
// //   env = {}
// // ): Terminal {
// //   // TODO: ensure that invoked processes are killed when Terminal is closed
// //   const terminalMode = preferenceService.get("vuengine.terminal.instances");
// //   const terminalClear = preferenceService.get("vuengine.terminal.clear");
// //   const enableWsl = preferenceService.get("build.enableWsl");
// //   const msysPath = getMsysPath();

// //   let terminalStillExists = false;
// //   for (const [key, value] of Object.entries(window.terminals)) {
// //     if (key && value["name"] && value["name"] == terminalName) {
// //       terminalStillExists = true;
// //     }
// //   }

// //   if (terminals[terminalName] && terminalClear && terminalStillExists) {
// //     terminals[terminalName].dispose();
// //     delete terminals[terminalName];
// //   }

// //   if (
// //     terminalMode == "Individual" ||
// //     !terminals[terminalName] ||
// //     !terminalStillExists
// //   ) {
// //     const terminalArgs: TerminalOptions = {
// //       name: terminalName,
// //       env: env,
// //     };

// //     // TODO: move to vuengine-run plugin
// //     if (terminalName == "run" && getOs() == "linux") {
// //       terminalArgs.env = {
// //         //'LD_LIBRARY_PATH': path.dirname(getExtensionConfig('emulator.path')) + '/usr/lib'
// //       };
// //     }

// //     if (isWindows) {
// //       if (enableWsl) {
// //         terminalArgs.shellPath = process.env.windir + "\\System32\\wsl.exe";
// //       } else {
// //         terminalArgs.shellPath = joinPath(msysPath, "usr", "bin", "bash.exe");
// //         terminalArgs.shellArgs = ["--login"];
// //       }
// //     }

// //     const newTerminal = window.createTerminal(terminalArgs);

// //     if (terminalMode == "Individual") {
// //       return newTerminal;
// //     } else {
// //       terminals[terminalName] = newTerminal;
// //     }
// //   }

// //   return terminals[terminalName];
// // }

export function convertoToEnvPath(
  preferenceService: PreferenceService,
  path: string
) {
  const enableWsl = preferenceService.get("build.enableWsl");
  let envPath = path.replace(/^[a-zA-Z]:\//, function (x) {
    return "/" + x.substr(0, 1).toLowerCase() + "/";
  });
  if (isWindows && enableWsl) {
    envPath = "/mnt/" + envPath;
  }
  return envPath;
}
