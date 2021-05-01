import { injectable, interfaces } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { BuildMenuSection } from "../build/build-menu-contribution";
import { VesFlashCartsCommands } from "./flash-carts-commands";

@injectable()
export class VesFlashCartsMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesFlashCartsCommands.FLASH.id,
      label: VesFlashCartsCommands.FLASH.label,
      order: "4"
    });
  }
}

export function bindVesFlashCartsMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesFlashCartsMenuContribution).inSingletonScope();
}

