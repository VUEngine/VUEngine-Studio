import { injectable } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { CommonMenus } from "@theia/core/lib/browser";
import { VesFlashCartsCommand } from "./commands";

@injectable()
export class VesFlashCartsMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.EDIT_FIND, {
      commandId: VesFlashCartsCommand.id,
      label: VesFlashCartsCommand.label,
    });
  }
}
