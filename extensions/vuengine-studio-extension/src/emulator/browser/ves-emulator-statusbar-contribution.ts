import { CommandService, Disposable, DisposableCollection, nls, PreferenceService, QuickPickService } from '@theia/core';
import { ApplicationShell, FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VB_FRAME_RATE } from 'vueport-core/lib/common/vb-constants';
import { onGamepadsChanged } from 'vueport-core/lib/browser/emulator-gamepad';
import { EmulatorMode } from 'vueport-core/lib/browser/emulator-types';
import {
  formatController,
  formatEmulationSpeed,
  formatEsSound,
  formatHardwareMode,
  formatProgramCounter,
  formatSymbolCount,
  STATUS_NONE,
} from 'vueport-core/lib/browser/emulator-status';
import { VesEmulatorWidget } from './ves-emulator-widget';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { EmulatorCommands } from 'vueport-core/lib/browser/emulator-commands';
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
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesEmulatorService)
    protected readonly vesEmulatorService: VesEmulatorService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected trackedEmulator?: VesEmulatorWidget;
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
            if (preferenceName === VesEmulatorPreferenceIds.EMULATOR_BUILTIN_HARDWARE_MODE
                || preferenceName === VesEmulatorPreferenceIds.EMULATOR_BUILTIN_SAVE_GAME_SLOT) {
                this.setEmulatorReadouts();
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

    protected trackCurrentEmulator(): void {
        const emulator = this.shell.currentWidget;
        if (!(emulator instanceof VesEmulatorWidget) || emulator === this.trackedEmulator) {
            return;
        }
        this.toDisposeOnTrackedEmulator.dispose();
        this.trackedEmulator = emulator;
        this.toDisposeOnTrackedEmulator.push(
            emulator.onDidChangeEmulationSpeed(() => this.setEmulatorReadouts())
        );
        this.toDisposeOnTrackedEmulator.push(
            emulator.onDidChangeMode(() => this.setEmulatorReadouts())
        );
        this.toDisposeOnTrackedEmulator.push(
            emulator.esSound.onDidChange(() => this.setEmulatorReadouts())
        );
        this.toDisposeOnTrackedEmulator.push(
            Disposable.create(onGamepadsChanged(() => this.setEmulatorReadouts()))
        );
        this.toDisposeOnTrackedEmulator.push(
            emulator.onDidDispose(() => {
                this.toDisposeOnTrackedEmulator.dispose();
                this.trackedEmulator = undefined;
                this.setEmulatorReadouts();
            })
        );
        this.setEmulatorReadouts();
    }

    protected setEmulatorReadouts(): void {
        this.setEmulationSpeedStatusBar();
        this.setSaveSlotStatusBar();
        this.setHardwareStatusBar();
        this.setControllerStatusBar();
        this.setEsSoundStatusBar();
        this.setDebugReadouts();
    }

    protected setReadout(
        id: string,
        priority: number,
        icon: string,
        label: string,
        value: string | undefined,
        options?: { command?: string, tooltip?: string },
    ): void {
        if (value === undefined) {
            this.statusBar.removeElement(id);
            return;
        }
        this.statusBar.setElement(id, {
            alignment: StatusBarAlignment.RIGHT,
            priority,
            text: `$(codicon-${icon}) ${value}`,
            tooltip: options?.tooltip ?? label,
            command: options?.command,
        });
    }

    setEmulationSpeedStatusBar(): void {
        const emulator = this.trackedEmulator;
        const speed = emulator?.emulationSpeed;
        this.setReadout(
            'ves-emulation-speed', 90, 'dashboard',
            nls.localize('vuengine/emulator/status/speed', 'Speed'),
            emulator && formatEmulationSpeed(emulator),
            {
                tooltip: speed
                    ? nls.localize(
                        'vuengine/emulator/emulationSpeed',
                        'Emulation speed: {0} of {1} fps',
                        Math.round(speed.framesPerSecond),
                        Math.round(VB_FRAME_RATE * speed.requested)
                    )
                    : nls.localize('vuengine/emulator/status/speed', 'Speed'),
            }
        );
    }

    setSaveSlotStatusBar(): void {
        const emulator = this.trackedEmulator;
        this.setReadout(
            'ves-emulator-save-slot', 88, 'save',
            nls.localize('vuengine/emulator/status/saveSlot', 'Save Slot'),
            `${nls.localize('vuengine/emulator/status/saveSlot', 'Save Slot')} ${emulator?.saveGameSlot}`,
            { command: EmulatorCommands.SET_SAVE_SLOT.id }
        );
    }

    setHardwareStatusBar(): void {
        const emulator = this.trackedEmulator;
        this.setReadout(
            'ves-emulator-hardware', 80, 'circuit-board',
            nls.localize('vuengine/emulator/status/hardware', 'Hardware'),
            emulator && formatHardwareMode(emulator),
            { command: EmulatorCommands.SET_HARDWARE_MODE.id }
        );
    }

    setControllerStatusBar(): void {
        const controller = this.trackedEmulator && formatController();
        this.setReadout(
            'ves-emulator-controller', 78, 'game',
            nls.localize('vuengine/emulator/status/controller', 'Controller'),
            controller === STATUS_NONE ? undefined : controller,
            { command: EmulatorCommands.INPUT_TOGGLE_CONTROLS_OVERLAY.id }
        );
    }

    setEsSoundStatusBar(): void {
        const emulator = this.trackedEmulator;
        this.setReadout(
            'ves-emulator-essound', 74, 'unmute',
            nls.localize('vuengine/emulator/status/esSound', 'ESSound'),
            emulator?.esSound.hasTracks ? formatEsSound(emulator) : undefined
        );
    }

    protected static readonly DEBUG_REFRESH_MS = 250;
    protected debugSampler?: number;

    protected setDebugReadouts(): void {
        const emulator = this.trackedEmulator;
        const debugging = emulator?.state.mode === EmulatorMode.DEBUG;
        if (!debugging) {
            this.stopDebugSampling();
            this.setReadout('ves-emulator-pc', 86, 'debug', '', undefined);
            this.setReadout('ves-emulator-symbols', 82, 'symbol-class', '', undefined);
            return;
        }

        emulator.dock.getSymbols()
            .then(symbols => {
                if (this.trackedEmulator === emulator) {
                    this.setReadout(
                        'ves-emulator-symbols', 82, 'symbol-class',
                        nls.localize('vuengine/emulator/status/symbols', 'Symbols'),
                        formatSymbolCount(symbols?.classes.size)
                    );
                }
            })
            .catch(() => undefined);
        this.startDebugSampling();
    }

    protected startDebugSampling(): void {
        if (this.debugSampler !== undefined) {
            return;
        }
        const read = (): void => {
            const emulator = this.trackedEmulator;
            const sim = emulator?.sim;
            if (!sim) {
                this.setReadout(
                    'ves-emulator-pc', 86, 'debug',
                    nls.localize('vuengine/emulator/status/pc', 'PC'),
                    formatProgramCounter(undefined)
                );
                return;
            }
            sim.readRegisters()
                .then(registers => {
                    // The machine can go away between the question and the answer.
                    if (this.trackedEmulator === emulator) {
                        this.setReadout(
                            'ves-emulator-pc', 86, 'debug',
                            nls.localize('vuengine/emulator/status/pc', 'PC'),
                            formatProgramCounter(registers.pc)
                        );
                    }
                })
                .catch(() => undefined);
        };
        read();
        this.debugSampler = window.setInterval(
            read, VesEmulatorStatusBarContribution.DEBUG_REFRESH_MS
        );
        this.toDisposeOnTrackedEmulator.push(Disposable.create(() => this.stopDebugSampling()));
    }

    protected stopDebugSampling(): void {
        if (this.debugSampler !== undefined) {
            window.clearInterval(this.debugSampler);
            this.debugSampler = undefined;
        }
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
