import { injectable, interfaces } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { VesSupportUsCommand } from "./support-us-commands";
import { CommonMenus } from "@theia/core/lib/browser";

@injectable()
export class VesSupportUsMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(CommonMenus.HELP, {
      commandId: VesSupportUsCommand.id,
      label: VesSupportUsCommand.label,
      order: "1"
    });
  }
}

export function bindVesSupportUsMenu(bind: interfaces.Bind): void {
  bind(MenuContribution).to(VesSupportUsMenuContribution).inSingletonScope();
}
