import { inject, injectable, interfaces } from "inversify";
import { FrontendApplication } from "@theia/core/lib/browser";
import { ElectronMenuContribution } from "@theia/core/lib/electron-browser/menu/electron-menu-contribution";
import { CommandService } from "@theia/core";
import { VesBuildCleanCommand, VesBuildCommand, VesBuildExportCommand } from "../../browser/build/commands";
import { VesRunCommand } from "../../browser/run/commands";
import { VesFlashCartsCommand } from "../../browser/flash-carts/commands";

@injectable()
export class VesElectronMenuContribution extends ElectronMenuContribution {
    @inject(CommandService) protected readonly commandService!: CommandService;
    protected hideTopPanel(frontendApplication: FrontendApplication): void {
        // override this with an empty function so the top panel is not removed in electron




        // TODO: move these to their dedicated place
        const { app } = require("electron").remote;
        app.on("ves-cmd-clean", () => this.commandService.executeCommand(VesBuildCleanCommand.id));
        app.on("ves-cmd-build", () => this.commandService.executeCommand(VesBuildCommand.id));
        app.on("ves-cmd-run", () => this.commandService.executeCommand(VesRunCommand.id));
        app.on("ves-cmd-flash", () => this.commandService.executeCommand(VesFlashCartsCommand.id));
        app.on("ves-cmd-export", () => this.commandService.executeCommand(VesBuildExportCommand.id));
    }
}

export function bindVesElectronMenu(bind: interfaces.Bind, rebind: interfaces.Rebind): void {
    bind(VesElectronMenuContribution).toSelf().inSingletonScope();
    rebind(ElectronMenuContribution).toService(VesElectronMenuContribution);
}
