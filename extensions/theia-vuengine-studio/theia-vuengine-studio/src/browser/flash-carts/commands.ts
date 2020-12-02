import {
  // inject,
  injectable,
} from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  // MessageService,
} from "@theia/core/lib/common";
// import { flashCommand } from "./commands/flash";
// import { PreferenceService } from "@theia/core/lib/browser";

export const VesFlashCartsCommand: Command = {
  id: "VesFlashCarts.commands.flash",
  // TODO: dynamic label based on connected flash cart? "Flash to HyperFlash32"
  label: "Flash to flash cart",
  category: "Flash",
  iconClass: "usb",
};

@injectable()
export class VesFlashCartsCommandContribution implements CommandContribution {
  constructor() // @inject(MessageService) private readonly messageService: MessageService,
  // @inject(PreferenceService) private readonly preferenceService: PreferenceService
  {}

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesFlashCartsCommand, {
      execute: () => console.log(""), //flashCommand(this.messageService, this.preferenceService),
    });
  }
}
