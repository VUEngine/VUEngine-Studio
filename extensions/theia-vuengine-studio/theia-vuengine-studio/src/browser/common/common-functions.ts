import { injectable, inject } from "inversify";
import { dirname, join as joinPath } from "path";
import { env } from "process";
import { KeybindingRegistry, PreferenceService } from "@theia/core/lib/browser";
import { WindowService } from "@theia/core/lib/browser/window/window-service";
import { isOSX, isWindows } from "@theia/core";
import { VesBuildPrefs } from "../build/build-preferences";

@injectable()
export class VesCommonFunctions {
  @inject(KeybindingRegistry) protected readonly keybindingRegistry: KeybindingRegistry;
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(WindowService) protected readonly windowService: WindowService;

  getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === "workspace"
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }

  getBuildFolder(): string {
    return joinPath(this.getWorkspaceRoot(), "build");
  }

  getBuildPath(buildMode?: string): string {
    const buildFolder = this.getBuildFolder();

    return buildMode
      ? joinPath(buildFolder, buildMode.toLowerCase())
      : buildFolder;
  }

  getRomPath(): string {
    const buildFolder = this.getBuildFolder();

    return joinPath(buildFolder, "output.vb");
  }

  getOs() {
    return isWindows ? "win" : isOSX ? "osx" : "linux";
  }

  getResourcesPath() {
    return env.THEIA_APP_PROJECT_PATH ?? "";
  }

  convertoToEnvPath(path: string) {
    const enableWsl = this.preferenceService.get(VesBuildPrefs.ENABLE_WSL.id);
    let envPath = path.replace(/\\/g, "/").replace(/^[a-zA-Z]:\//, function(x) {
      return `/${x.substr(0, 1).toLowerCase()}/`;
    });

    if (isWindows && enableWsl) {
      envPath = "/mnt/" + envPath;
    }

    return envPath;
  }

  openUrl(url: string) {
    this.windowService.openNewWindow(url, { external: true });
  }

  getKeybindingLabel(
    commandId: string,
    wrapInBrackets: boolean = false
  ): string {
    const keybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId)[0];
    let keybindingAccelerator = keybinding
      ? this.keybindingRegistry.acceleratorFor(keybinding, "+").join(", ")
      : "";
    if (wrapInBrackets && keybindingAccelerator !== "") {
      keybindingAccelerator = ` (${keybindingAccelerator})`;
    }

    return keybindingAccelerator;
  }
}
