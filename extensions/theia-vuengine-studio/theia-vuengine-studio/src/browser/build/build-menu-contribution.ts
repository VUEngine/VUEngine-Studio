import { injectable, interfaces } from "inversify";
import { MAIN_MENU_BAR, MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { VesBuildCommands } from "./build-commands";

export const buildMenuPath = [...MAIN_MENU_BAR, "vesBuild"];
export namespace BuildMenuSection {
  export const ACTION = [...MAIN_MENU_BAR, "vesBuild", '1_action'];
  export const CONFIG = [...MAIN_MENU_BAR, "vesBuild", '2_config'];
  export const BUILD_OPTION = [...MAIN_MENU_BAR, "vesBuild", '3_build_option'];
}

@injectable()
export class VesBuildMenuContribution implements MenuContribution {

  registerMenus(menus: MenuModelRegistry): void {
    menus.registerSubmenu(buildMenuPath, "Build", {
      order: "6"
    });

    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCommands.CLEAN.id,
      label: VesBuildCommands.CLEAN.label,
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCommands.BUILD.id,
      label: VesBuildCommands.BUILD.label,
      order: "2"
    });
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesBuildCommands.EXPORT.id,
      label: VesBuildCommands.EXPORT.label,
      order: "5"
    });

    menus.registerMenuAction(BuildMenuSection.CONFIG, {
      commandId: VesBuildCommands.SET_MODE.id,
      label: VesBuildCommands.SET_MODE.label,
      order: "1"
    });

    menus.registerMenuAction(BuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildCommands.TOGGLE_DUMP_ELF.id,
      label: "Dump ELF",
      order: "1"
    });
    menus.registerMenuAction(BuildMenuSection.BUILD_OPTION, {
      commandId: VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS.id,
      label: "Pedantic Warnings",
      order: "2"
    });
    /*if (isWindows) {
      menus.registerMenuAction(BuildMenuSection.OPTION, {
        commandId: VesBuildCommands.TOGGLE_ENABLE_WSL.id,
        label: "Enable WSL",
        order: "3"
      });
    }*/
  }
}

export function bindVesBuildMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesBuildMenuContribution).inSingletonScope();
}