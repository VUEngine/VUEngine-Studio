import { Command, CommandContribution, CommandRegistry, CompositeMenuNode, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry, MenuNode, SubMenuOptions } from "@theia/core/lib/common";
import { injectable, interfaces } from "inversify";

const BuildCommand: Command = {
    id: "vuengine-build-run",
    label: "Build project",
    category: "Build"
};
const BuildToggleDumpElfCommand: Command = {
    id: "vuengine-build-toggle-dump-elf",
    label: "Dump ELF",
    category: "Build"
};
const BuildEnableWslCommand: Command = {
    id: "vuengine-build-enable-wsl-elf",
    label: "Enable WSL",
    category: "Build"
};
const BuildTogglePedanticWarningsCommand: Command = {
    id: "vuengine-build-toggle-pedantic-warnings-elf",
    label: "Toggle pedantic warnings",
    category: "Build"
};
const BuildModeSetReleaseCommand: Command = {
    id: "vuengine-build-mode-set-release",
    label: `Set build mode to "release"`,
    category: "Build"
};
const BuildModeSetBetaCommand: Command = {
    id: "vuengine-build-mode-set-beta",
    label: `Set build mode to "beta"`,
    category: "Build"
};

@injectable()
export class SampleCommandContribution implements CommandContribution {
    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(BuildCommand, {
            execute: () => {
                alert("Lets-a-build");
            }
        });
        commands.registerCommand(BuildToggleDumpElfCommand, {
            execute: () => {
                alert("Toggle dump ELF");
            }
        });
        commands.registerCommand(BuildEnableWslCommand, {
            execute: () => {
                alert("User WSL for building");
            }
        });
        commands.registerCommand(BuildTogglePedanticWarningsCommand, {
            execute: () => {
                alert("User WSL for building");
            }
        });
        commands.registerCommand(BuildModeSetReleaseCommand, {
            execute: () => {
                alert("Release");
            }
        });
        commands.registerCommand(BuildModeSetBetaCommand, {
            execute: () => {
                alert("BEta");
            }
        });
    }
}

@injectable()
export class SampleMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
        const buildMenuPath = [...MAIN_MENU_BAR, "build-menu"];
        menus.registerSubmenu(buildMenuPath, "Build", {
            order: "6"
        });

        menus.registerMenuAction(buildMenuPath, {
            commandId: BuildCommand.id,
            order: "0"
        });
        menus.registerMenuAction(buildMenuPath, {
            commandId: BuildToggleDumpElfCommand.id,
            label: "Dump ELF",
            order: "1"
        });
        menus.registerMenuAction(buildMenuPath, {
            commandId: BuildEnableWslCommand.id,
            label: "Enable WSL",
            order: "2"
        });
        menus.registerMenuAction(buildMenuPath, {
            commandId: BuildTogglePedanticWarningsCommand.id,
            label: "Pedantic warnings",
            order: "3"
        });

        const buildSubMenuPath = [...buildMenuPath, "build-sub-menu"];
        menus.registerSubmenu(buildSubMenuPath, "Build Mode", { order: "2" });

        menus.registerMenuAction(buildSubMenuPath, {
            commandId: BuildModeSetReleaseCommand.id,
            label: "Release",
            order: "0"
        });
        menus.registerMenuAction(buildSubMenuPath, {
            commandId: BuildModeSetBetaCommand.id,
            label: "Beta",
            order: "3"
        });

        const placeholder = new PlaceholderMenuNode([...buildSubMenuPath, "placeholder"].join("-"), "Placeholder", { order: "2" });
        menus.registerMenuNode(buildSubMenuPath, placeholder);


        const testMenuNode = new CompositeMenuNode([...buildSubMenuPath, "composite"].join("-"), "TEHEEEST", { order: "2" });
        menus.registerMenuNode(buildMenuPath, testMenuNode);
    }

}

/**
 * Special menu node that is not backed by any commands and is always disabled.
 */
export class PlaceholderMenuNode implements MenuNode {

    constructor(readonly id: string, public readonly label: string, protected options?: SubMenuOptions) { }

    get icon(): string | undefined {
        return this.options?.iconClass;
    }

    get sortString(): string {
        return this.options?.order || this.label;
    }

}

export const bindSampleMenu = (bind: interfaces.Bind) => {
    bind(CommandContribution).to(SampleCommandContribution).inSingletonScope();
    bind(MenuContribution).to(SampleMenuContribution).inSingletonScope();
};
