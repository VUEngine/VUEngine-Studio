import { dirname, join as joinPath } from "path";
import { env } from "process";
import { shell } from "electron";
import { KeybindingRegistry, PreferenceService } from "@theia/core/lib/browser";
import { isOSX, isWindows } from "@theia/core";
import { VesBuildPrefs } from "../build/build-preferences";

export function getWorkspaceRoot(): string {
  const substrNum = isWindows ? 2 : 1;
  return (window.location.hash.slice(-9) === "workspace")
    ? dirname(window.location.hash.substring(substrNum))
    : window.location.hash.substring(substrNum);
}

export function getBuildPath(buildMode?: string) {
  const buildRoot = joinPath(getWorkspaceRoot(), "build");
  return buildMode ? joinPath(buildRoot, buildMode.toLowerCase()) : buildRoot;
}

export function getRomPath(): string {
  const buildRoot = joinPath(getWorkspaceRoot(), "build");
  return joinPath(buildRoot, "output.vb");
}

export function getOs() {
  return isWindows ? "win" : isOSX ? "osx" : "linux";
}

export function getResourcesPath() {
  return env.THEIA_APP_PROJECT_PATH ?? "";
}

export function convertoToEnvPath(
  preferenceService: PreferenceService,
  path: string
) {
  const enableWsl = preferenceService.get(VesBuildPrefs.ENABLE_WSL.id);
  let envPath = path.replace(/\\/g, '/').replace(/^[a-zA-Z]:\//, function (x) {
    return `/${x.substr(0, 1).toLowerCase()}/`;
  });

  if (isWindows && enableWsl) {
    envPath = "/mnt/" + envPath;
  }
  return envPath;
}

export function openUrl(url: string) {
  shell.openExternal(url);
}

export function getKeybindingLabel(keybindingRegistry: KeybindingRegistry, commandId: string, wrapInBrackets: boolean = false): string {
  const keybinding = keybindingRegistry.getKeybindingsForCommand(commandId)[0];
  let keybindingAccelerator = keybinding ? keybindingRegistry.acceleratorFor(keybinding, "+").join(", ") : "";
  if (wrapInBrackets && keybindingAccelerator !== "") {
    keybindingAccelerator = ` (${keybindingAccelerator})`
  }
  return keybindingAccelerator;
};