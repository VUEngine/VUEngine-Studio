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

export const VesFlashCartsCommand: Command = {
  id: "VesFlashCarts.commands.flash",
  // TODO: dynamic label based on connected flash cart? "Flash to HyperFlash32"
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
          this.vesState
        ),
    });
  }
}

export function bindVesFlashCartsCommands(bind: interfaces.Bind): void {
  bind(CommandContribution).to(VesFlashCartsCommandContribution).inSingletonScope();
}
