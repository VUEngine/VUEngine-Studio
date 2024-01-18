import { CommonMenus, LocalStorageService } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { PreferenceScope, PreferenceService } from '@theia/core/lib/browser/preferences';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import {
    CommandContribution,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    MenuPath,
    MessageService,
    nls
} from '@theia/core/lib/common';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { FrontendApplicationState } from '@theia/core/lib/common/frontend-application-state';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { VesUpdaterCommands } from './ves-updater-commands';
import { VesUpdaterPreferenceIds } from './ves-updater-preferences';

export namespace VesUpdaterMenu {
    export const MENU_PATH: MenuPath = [...CommonMenus.FILE_SETTINGS_SUBMENU, '3_settings_submenu_update'];
}

const LOCAL_SETTINGS_IGNORE_KEY = 'ves-updater-ignore-version';

@injectable()
export class VesUpdaterFrontendContribution implements CommandContribution, MenuContribution {
    @inject(ApplicationServer)
    protected readonly appServer: ApplicationServer;
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;
    @inject(MessageService)
    protected readonly messageService: MessageService;
    @inject(PreferenceService)
    private readonly preferenceService: PreferenceService;
    @inject(WindowService)
    protected readonly windowService: WindowService;

    @postConstruct()
    protected init(): void {
        this.bindEvents();
    }

    protected bindEvents(): void {
        this.frontendApplicationStateService.onStateChanged(
            async (state: FrontendApplicationState) => {
                if (state === 'ready') {
                    await this.doStartUpCheck();
                }
            }
        );
    }

    protected async doStartUpCheck(): Promise<void> {
        await this.preferenceService.ready;
        const reportOnStart = this.preferenceService.get(VesUpdaterPreferenceIds.REPORT_ON_START) as boolean;
        if (reportOnStart) {
            await this.checkForUpdates(true);
        }
    }

    protected async checkForUpdates(startup: boolean): Promise<void> {
        const ignoreVersion = await this.localStorageService.getData(LOCAL_SETTINGS_IGNORE_KEY);
        const applicationInfo = await this.appServer.getApplicationInfo();
        const currentVersion = applicationInfo?.version || '0.0.0';
        const newVersion = await window.electronVesCore.checkUpdateAvailable(currentVersion);
        if (newVersion !== false) {
            if (startup && newVersion === ignoreVersion) {
                return;
            }
            await this.handleUpdateAvailable(currentVersion, newVersion as string);
        } else if (!startup) {
            this.handleNoUpdate();
        }
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(VesUpdaterCommands.CHECK_FOR_UPDATES, {
            execute: async () => {
                this.checkForUpdates(false);
            },
            isEnabled: () => true,
            isVisible: () => true,
        });
    }

    registerMenus(registry: MenuModelRegistry): void {
        registry.registerMenuAction(VesUpdaterMenu.MENU_PATH, {
            commandId: VesUpdaterCommands.CHECK_FOR_UPDATES.id
        });
    }

    protected async handleUpdateAvailable(currentVersion: string, newVersion: string): Promise<void> {
        const download = nls.localize('vuengine/updater/download', 'Download');
        const ignoreVersion = nls.localize('vuengine/updater/ignoreVersion', 'Ignore this version');
        const neverCheck = nls.localize('vuengine/updater/doNotCheckOnStart', 'Do not check on start');
        const answer = await this.messageService.info(
            nls.localize(
                'vuengine/updater/updateAvailable',
                'Version {0} of VUEngine Studio is available. You are on version {1}.',
                newVersion,
                currentVersion
            ),
            download, ignoreVersion, neverCheck
        );
        if (answer === neverCheck) {
            this.preferenceService.set(VesUpdaterPreferenceIds.REPORT_ON_START, false, PreferenceScope.User);
            return;
        } else if (answer === download) {
            this.windowService.openNewWindow('https://www.vuengine.dev/downloads/', { external: true });
        } else if (answer === ignoreVersion) {
            await this.localStorageService.setData(LOCAL_SETTINGS_IGNORE_KEY, newVersion);
        }
    }

    protected async handleNoUpdate(): Promise<void> {
        this.messageService.info(nls.localize(
            'vuengine/updater/alreadyUsingLatestVersion',
            'You are already using the latest version of VUEngine Studio.'
        ));
    }
}
