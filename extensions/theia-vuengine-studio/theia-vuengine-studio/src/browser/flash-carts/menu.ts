import { injectable, interfaces } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { VesFlashCartsCommand } from "./commands";
import { BuildMenuSection } from "../build/menu";

@injectable()
export class VesFlashCartsMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesFlashCartsCommand.id,
      label: VesFlashCartsCommand.label,
      order: "4"
    });
  }
}

export function bindVesFlashCartsMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesFlashCartsMenuContribution).inSingletonScope();
}

