import { injectable, interfaces } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { VesSupportUsCommand } from "./commands";
import { CommonMenus } from "@theia/core/lib/browser";

@injectable()
export class VesBrandingMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.HELP, {
      commandId: VesSupportUsCommand.id,
      label: VesSupportUsCommand.label,
      order: "1"
    });
  }
}

export function bindVesBrandingMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesBrandingMenuContribution).inSingletonScope();
}
