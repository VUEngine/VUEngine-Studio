import { injectable, interfaces } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { BuildMenuSection } from "../build/menu-contribution";
import { VesRunCommand, VesSelectEmulatorCommand } from "./commands";

@injectable()
export class VesRunMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesRunCommand.id,
      label: VesRunCommand.label,
      order: "3",
    });
    menus.registerMenuAction(BuildMenuSection.CONFIG, {
      commandId: VesSelectEmulatorCommand.id,
      label: VesSelectEmulatorCommand.label,
      order: "2",
    });
  }
}

export function bindVesRunMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesRunMenuContribution).inSingletonScope();
}
