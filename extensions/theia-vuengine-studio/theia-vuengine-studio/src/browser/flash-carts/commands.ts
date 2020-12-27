import { inject, injectable, interfaces } from "inversify";
import {
  Command,
  CommandContribution,
  CommandRegistry,
  CommandService,
  MessageService,
} from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { flashCommand } from "./commands/flash";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesStateModel } from "../common/vesStateModel";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesUsbService } from "../../common/usb-service-protocol";

export const VesFlashCartsCommand: Command = {
  id: "VesFlashCarts.commands.flash",
  label: "Flash to Flash Cart",
  category: "Flash",
  iconClass: "fa fa-usb",
};

@injectable()
export class VesFlashCartsCommandContribution implements CommandContribution {
  constructor(
    @inject(CommandService) private readonly commandService: CommandService,
    @inject(FileService) private readonly fileService: FileService,
    @inject(MessageService) private readonly messageService: MessageService,
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService,
    @inject(TerminalService) private readonly terminalService: TerminalService,
    @inject(VesUsbService) private readonly vesUsbService: VesUsbService,
    @inject(VesStateModel) private readonly vesState: VesStateModel,
  ) { }

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(VesFlashCartsCommand, {
      execute: () =>
        flashCommand(
          this.commandService,
          this.fileService,
          this.messageService,
          this.preferenceService,
          this.terminalService,
          this.vesUsbService,
          this.vesState
        ),
    });
  }
}

export function bindVesFlashCartsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesFlashCartsCommandContribution).inSingletonScope();
}
