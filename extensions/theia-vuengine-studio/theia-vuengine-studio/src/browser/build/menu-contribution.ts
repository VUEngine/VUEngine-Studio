import { injectable, interfaces } from "inversify";
import { MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import {
  VesBuildCleanCommand,
  VesBuildCommand,
  VesBuildExportCommand,
  VesBuildSetModeReleaseCommand,
  VesBuildSetModeBetaCommand,
  VesBuildSetModeToolsCommand,
  VesBuildSetModeDebugCommand,
  VesBuildSetModePreprocessorCommand,
  VesBuildToggleDumpElfCommand,
  VesBuildTogglePedanticWarningsCommand,
} from "./commands/definitions";

export const buildMenuPath = [...MAIN_MENU_BAR, "vesBuild"];
export namespace BuildMenuSection {
  export const ACTION = [...MAIN_MENU_BAR, "vesBuild", '1_action'];
  export const MODE = [...MAIN_MENU_BAR, "vesBuild", '2_mode'];
  export const BUILD_OPTION = [...MAIN_MENU_BAR, "vesBuild", '3_build_option'];
  export const DEFAULTS = [...MAIN_MENU_BAR, "vesBuild", '4_defaults'];
}

@injectable()
export class VesBuildMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerSubmenu(buildMenuPath, "Build", {
      order: "6"
    });

    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCleanCommand.id,
      label: VesBuildCleanCommand.label,
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCommand.id,
      label: VesBuildCommand.label,
      order: "2"
    });
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildExportCommand.id,
      label: VesBuildExportCommand.label,
      order: "5"
    });

    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeReleaseCommand.id,
      label: "Release Mode",
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeBetaCommand.id,
      label: "Beta Mode",
      order: "2"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeToolsCommand.id,
      label: "Tools Mode",
      order: "3"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeDebugCommand.id,
      label: "Debug Mode",
      order: "4"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModePreprocessorCommand.id,
      label: "Preprocessor Mode",
      order: "5"
    });

    menus.registerMenuAction(BuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildToggleDumpElfCommand.id,
      label: "Dump ELF",
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildTogglePedanticWarningsCommand.id,
      label: "Pedantic Warnings",
      order: "2"
    });
    /*if (isWindows) {
      menus.registerMenuAction(BuildMenuSection.OPTION, {
        commandId: VesBuildToggleEnableWslCommand.id,
        label: "Enable WSL",
        order: "3"
      });
    }*/
  }
}

export function bindVesBuildMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesBuildMenuContribution).inSingletonScope();
}