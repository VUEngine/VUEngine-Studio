import { DisposableCollection, nls, PreferenceService } from '@theia/core';
import { ApplicationShell, FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VB_FRAME_RATE } from 'vueport-core/lib/common/vb-constants';
import { VesEmulatorWidget } from './ves-emulator-widget';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import {
  VbLinkStatus,
} from 'vueport-core/lib/browser/emulator-types';
import { RED_VIPER_VBLINK_CHUNK_SIZE_BYTES } from './ves-emulator-types';

@injectable()
export class VesEmulatorStatusBarContribution implements FrontendApplicationContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    /** The emulator whose speed the status bar is showing, if any. */
    protected trackedEmulator?: VesEmulatorWidget;
    /** Bound to that emulator, and dropped when the entry follows another one. */
    protected readonly toDisposeOnTrackedEmulator = new DisposableCollection();

    async onStart(app: FrontendApplication): Promise<void> {
        await this.workspaceService.ready;
        if (this.workspaceService.opened) {
            this.updateStatusBar();
        }
    };

    updateStatusBar(): void {
        this.setCurrentEmulatorStatusBar();
        this.setVbLinkStatusBar();
        this.trackCurrentEmulator();
        this.shell.onDidChangeCurrentWidget(() => this.trackCurrentEmulator());

        this.vesEmulatorService.onDidChangeEmulator(() => this.setCurrentEmulatorStatusBar());
        this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
            if (preferenceName === VesEmulatorPreferenceIds.DEFAULT_EMULATOR) {
                this.setCurrentEmulatorStatusBar();
            }
        });
        this.vesEmulatorService.onDidChangeVbLinkStatus(() => this.setVbLinkStatusBar());
    }

    setCurrentEmulatorStatusBar(): void {
        const label = this.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR) ||
            nls.localize('vuengine/emulator/builtIn', 'Built-In');
        this.statusBar.setElement('ves-current-emulator', {
            alignment: StatusBarAlignment.LEFT,
            command: VesEmulatorCommands.SELECT.id,
            priority: 2,
            text: `$(codicon-play) ${label}`,
            tooltip: VesEmulatorCommands.SELECT.label,
        });
    }

    /**
     * Follow the emulator the user is working in.
     *
     * Focusing something that is not an emulator — going back to the code, say
     * — leaves the entry on the emulator it was already following, rather than
     * dropping out of the bar for as long as the game is not the current tab.
     * It only goes away when that emulator closes.
     */
    protected trackCurrentEmulator(): void {
        const emulator = this.shell.currentWidget;
        if (!(emulator instanceof VesEmulatorWidget) || emulator === this.trackedEmulator) {
            return;
        }
        this.toDisposeOnTrackedEmulator.dispose();
        this.trackedEmulator = emulator;
        this.toDisposeOnTrackedEmulator.push(
            emulator.onDidChangeEmulationSpeed(() => this.setEmulationSpeedStatusBar())
        );
        this.toDisposeOnTrackedEmulator.push(
            emulator.onDidDispose(() => {
                this.toDisposeOnTrackedEmulator.dispose();
                this.trackedEmulator = undefined;
                this.setEmulationSpeedStatusBar();
            })
        );
        this.setEmulationSpeedStatusBar();
    }

    setEmulationSpeedStatusBar(): void {
        const speed = this.trackedEmulator?.emulationSpeed;
        if (!speed) {
            this.statusBar.removeElement('ves-emulation-speed');
            return;
        }
        const framesPerSecond = Math.round(speed.framesPerSecond);
        // The rate being aimed for, which fast forward and slow motion move.
        const target = Math.round(VB_FRAME_RATE * speed.requested);
        this.statusBar.setElement('ves-emulation-speed', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 5,
            text: `$(codicon-dashboard) ${Math.round(speed.ratio * 100)}%`,
            tooltip: nls.localize(
                'vuengine/emulator/emulationSpeed',
                'Emulation speed: {0} of {1} fps',
                framesPerSecond,
                target
            ),
        });
    }

    setVbLinkStatusBar(): void {
        if (this.vesEmulatorService.vbLinkStatus.status === VbLinkStatus.idle) {
            this.statusBar.removeElement('ves-vblink-status');
        } else {
            let label = nls.localize('vuengine/emulator/redViper/connecting', 'Connecting to 3DS...');
            if (this.vesEmulatorService.vbLinkStatus.status !== VbLinkStatus.connect) {
                label = nls.localize('vuengine/emulator/redViper/transferring', 'Transferring to 3DS...');
                const totalChunks = Math.ceil(this.vesEmulatorService.vbLinkStatus.data?.byteLength! / RED_VIPER_VBLINK_CHUNK_SIZE_BYTES);
                const progress = Math.round(
                    this.vesEmulatorService.vbLinkStatus.done * 100 / totalChunks
                );
                label = `${label} (${progress}%)`;
            }
            this.statusBar.setElement('ves-vblink-status', {
                alignment: StatusBarAlignment.LEFT,
                command: VesEmulatorCommands.CANCEL_RED_VIPER_TRANSFER.id,
                priority: 1,
                text: `$(codicon-loading~spin) ${label}`,
            });
        }
    }
}
