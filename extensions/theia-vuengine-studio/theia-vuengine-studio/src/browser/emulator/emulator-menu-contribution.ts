import { injectable, interfaces } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { BuildMenuSection } from "../build/build-menu-contribution";
import { VesEmulatorCommands } from "./emulator-commands";

@injectable()
export class VesRunMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesEmulatorCommands.RUN.id,
      label: VesEmulatorCommands.RUN.label,
      order: "3",
    });
    menus.registerMenuAction(BuildMenuSection.CONFIG, {
      commandId: VesEmulatorCommands.SELECT.id,
      label: VesEmulatorCommands.SELECT.label,
      order: "2",
    });
  }
}

export function bindVesRunMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesRunMenuContribution).inSingletonScope();
}
