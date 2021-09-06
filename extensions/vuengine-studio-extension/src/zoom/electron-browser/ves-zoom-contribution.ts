import { remote } from '@theia/core/shared/electron';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandContribution, CommandRegistry } from '@theia/core/lib/common/command';
import { VesZoomCommands } from './ves-zoom-commands';
import { ElectronCommands } from '@theia/core/lib/electron-browser/menu/electron-menu-contribution';
import { KeybindingContribution, KeybindingRegistry, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { VesZoomPreferenceIds, VesZoomPreferenceSchema } from './ves-zoom-preferences';
import { VesZoomStatusBarContribution } from './ves-zoom-statusbar-contribution';

@injectable()
export class VesZoomContribution implements CommandContribution, KeybindingContribution {
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesZoomStatusBarContribution) protected readonly vesZoomStatusBarContribution: VesZoomStatusBarContribution;

    @postConstruct()
    protected async init(): Promise<void> {
        this.preferenceService.ready.then(() => {
            this.applyConfiguredZoomFactor();
            this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
                if (preferenceName === VesZoomPreferenceIds.ZOOM_LEVEL) {
                    this.applyConfiguredZoomFactor();
                }
            });
        });
    }

    registerCommands(commandRegistry: CommandRegistry): void {
        commandRegistry.unregisterCommand(ElectronCommands.ZOOM_IN);
        commandRegistry.registerCommand(VesZoomCommands.ZOOM_IN, {
            execute: () => this.changeZoomFactor(1)
        });

        commandRegistry.unregisterCommand(ElectronCommands.ZOOM_OUT);
        commandRegistry.registerCommand(VesZoomCommands.ZOOM_OUT, {
            execute: () => this.changeZoomFactor(-1)
        });

        commandRegistry.unregisterCommand(ElectronCommands.RESET_ZOOM);
        commandRegistry.registerCommand(VesZoomCommands.RESET_ZOOM, {
            execute: () => this.setDefaultZoomFactor()
        });
    }

    registerKeybindings(registry: KeybindingRegistry): void {
        registry.unregisterKeybinding(ElectronCommands.ZOOM_IN);
        registry.registerKeybinding({
            command: VesZoomCommands.ZOOM_IN.id,
            // TODO: "plus" is not working, despite being described in @theia/keymaps/README.md
            // keybinding: 'ctrlcmd+plus',
            keybinding: 'ctrlcmd+shift+0',
        });

        registry.unregisterKeybinding(ElectronCommands.ZOOM_OUT);
        registry.registerKeybinding({
            command: VesZoomCommands.ZOOM_OUT.id,
            keybinding: 'ctrlcmd+-',
        });

        registry.unregisterKeybinding(ElectronCommands.RESET_ZOOM);
        registry.registerKeybinding({
            command: VesZoomCommands.RESET_ZOOM.id,
            keybinding: 'ctrlcmd+0',
        });
    }

    protected setDefaultZoomFactor(): void {
        this.setZoomFactor(1);
    }

    protected changeZoomFactor(direction: -1 | 1): void {
        const zoomFactors = VesZoomPreferenceSchema.properties[VesZoomPreferenceIds.ZOOM_LEVEL]?.enum;
        if (!zoomFactors) {
            return;
        }
        const convertedZoomFactors = zoomFactors.map(value => this.toZoomFactor(value));
        let newZoomFactor = this.toZoomFactor(this.preferenceService.get(VesZoomPreferenceIds.ZOOM_LEVEL) as string);

        for (let index = 0; index < zoomFactors.length; index++) {
            if (newZoomFactor === convertedZoomFactors[index] && zoomFactors[index + direction]) {
                newZoomFactor = convertedZoomFactors[index + direction];
                break;
            }
        }

        this.setZoomFactor(newZoomFactor);
    }

    protected setZoomFactor(zoomFactor: number): void {
        const currentWindow = remote.getCurrentWindow();
        currentWindow.webContents.setZoomFactor(zoomFactor);

        this.preferenceService.set(
            VesZoomPreferenceIds.ZOOM_LEVEL,
            this.fromZoomFactor(zoomFactor),
            PreferenceScope.User
        );
    }

    protected applyConfiguredZoomFactor(): void {
        const currentZoomFactor = this.toZoomFactor(this.preferenceService.get(VesZoomPreferenceIds.ZOOM_LEVEL) as string);
        this.setZoomFactor(currentZoomFactor);
    }

    protected toZoomFactor(value: string): number {
        return parseInt(value.replace('%', '')) / 100;
    };

    protected fromZoomFactor(value: number): string {
        return `${Math.floor(value * 100)}%`;
    };
}
