import { injectable } from "inversify";
import { MenuContribution, MenuModelRegistry } from "@theia/core/lib/common";
import { VesRunCommand, VesSelectEmulatorCommand } from "./commands";
import { BuildMenuSection } from "../build/menu";

@injectable()
export class VesRunMenuContribution implements MenuContribution {
  registerMenus(menus: MenuModelRegistry): void {
    menus.registerMenuAction(BuildMenuSection.ACTION, {
      commandId: VesRunCommand.id,
      label: VesRunCommand.label,
      order: "3",
    });
    menus.registerMenuAction(BuildMenuSection.BUILD_OPTION, {
      commandId: VesSelectEmulatorCommand.id,
      label: VesSelectEmulatorCommand.label,
      order: "3",
    });
  }
}
