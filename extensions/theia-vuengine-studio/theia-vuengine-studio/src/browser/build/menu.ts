import { injectable } from "inversify";
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
  VesBuildEnableDumpElfCommand,
  VesBuildDisableDumpElfCommand,
  VesBuildEnablePedanticWarningsCommand,
  VesBuildDisablePedanticWarningsCommand
} from "./commands";

export const buildMenuPath = [...MAIN_MENU_BAR, "vesBuild"];
export namespace BuildMenuSection {
  export const ACTION = [...MAIN_MENU_BAR, "vesBuild", '1_action'];
  export const MODE = [...MAIN_MENU_BAR, "vesBuild", '2_mode'];
  export const OPTION = [...MAIN_MENU_BAR, "vesBuild", '3_options'];
}

@injectable()
export class VesBuildMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerSubmenu(buildMenuPath, "Build", {
      order: "6"
    });

    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCommand.id,
      label: VesBuildCommand.label,
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCleanCommand.id,
      label: VesBuildCleanCommand.label,
      order: "2"
    });
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildExportCommand.id,
      label: VesBuildExportCommand.label,
      order: "5"
    });

    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeReleaseCommand.id,
      label: "release",
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeBetaCommand.id,
      label: "beta",
      order: "2"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeToolsCommand.id,
      label: "tools",
      order: "3"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModeDebugCommand.id,
      label: "debug",
      order: "4"
    });
    menus.registerMenuAction(BuildMenuSection.MODE, {
      commandId: VesBuildSetModePreprocessorCommand.id,
      label: "preprocessor",
      order: "5"
    });

    menus.registerMenuAction(BuildMenuSection.OPTION, {
      commandId: VesBuildEnableDumpElfCommand.id,
      label: VesBuildEnableDumpElfCommand.label,
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.OPTION, {
      commandId: VesBuildDisableDumpElfCommand.id,
      label: VesBuildDisableDumpElfCommand.label,
      order: "2"
    });
    menus.registerMenuAction(BuildMenuSection.OPTION, {
      commandId: VesBuildEnablePedanticWarningsCommand.id,
      label: VesBuildEnablePedanticWarningsCommand.label,
      order: "3"
    });
    menus.registerMenuAction(BuildMenuSection.OPTION, {
      commandId: VesBuildDisablePedanticWarningsCommand.id,
      label: VesBuildDisablePedanticWarningsCommand.label,
      order: "4"
    });
  }
}