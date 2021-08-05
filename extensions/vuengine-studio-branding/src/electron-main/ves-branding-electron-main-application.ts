import { injectable } from '@theia/core/shared/inversify';
import { app, BrowserWindow, nativeImage, TouchBar } from '@theia/core/shared/electron'; /* eslint-disable-line */
import { ElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { isOSX, MaybePromise } from '@theia/core';
import { VesBuildCommands } from 'vuengine-studio-build/lib/browser/ves-build-commands';
import { VesEmulatorCommands } from 'vuengine-studio-emulator/lib/browser/ves-emulator-commands';
import { VesExportCommands } from 'vuengine-studio-export/lib/browser/ves-export-commands';
import { VesFlashCartCommands } from 'vuengine-studio-flash-cart/lib/browser/ves-flash-cart-commands';
import { BuildMode } from 'vuengine-studio-build/lib/browser/ves-build-types';

import { VesTouchBarIcons } from './icons/touch-bar-icons';
import { VesTouchBarCommands } from '../common/ves-branding-types';

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    protected grayscaleCss: string = '';

    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultBrowserWindowOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);

        electronWindow.on('focus', async () => {
            if (this.grayscaleCss !== '') {
                await electronWindow.webContents.removeInsertedCSS(this.grayscaleCss);
            }
        });
        electronWindow.on('blur', async () => {
            this.grayscaleCss = await electronWindow.webContents.insertCSS('html { filter: grayscale(1); transition: filter 1s; }');
        });

        this.registerVesTouchBar(electronWindow);

        return electronWindow;
    }

    protected async getDefaultBrowserWindowOptions(): Promise<TheiaBrowserWindowOptions> {
        return {
            ...await super.getDefaultBrowserWindowOptions(),
            backgroundColor: '#222',
            frame: isOSX,
            minHeight: 560,
            minWidth: 820,
            titleBarStyle: 'hiddenInset'
        };
    }
    protected registerVesTouchBar(electronWindow: BrowserWindow): void {
        const { TouchBarButton, TouchBarLabel, TouchBarPopover, TouchBarSegmentedControl } = TouchBar;

        // const vesIcon = nativeImage.createFromDataURL(VesTouchBarIcons.VES).resize({ height: 16 });
        const cleanIcon = nativeImage.createFromDataURL(VesTouchBarIcons.CLEAN).resize({ height: 16 });
        const buildIcon = nativeImage.createFromDataURL(VesTouchBarIcons.BUILD).resize({ height: 18 });
        // const buildIconWide = nativeImage.createFromDataURL(VesTouchBarIcons.BUILD_WIDE).resize({ height: 18 });
        const runIcon = nativeImage.createFromDataURL(VesTouchBarIcons.RUN).resize({ height: 16 });
        const flashIcon = nativeImage.createFromDataURL(VesTouchBarIcons.FLASH).resize({ height: 18 });
        const exportIcon = nativeImage.createFromDataURL(VesTouchBarIcons.EXPORT).resize({ height: 16 });
        const menuIcon = nativeImage.createFromDataURL(VesTouchBarIcons.MENU).resize({ height: 16 });
        const queuedIcon = nativeImage.createFromDataURL(VesTouchBarIcons.QUEUED).resize({ height: 16 });

        let spinnerIconFrame = 0;
        let spinnerIconIntervall: NodeJS.Timer | null = null; /* eslint-disable-line */
        const spinnerIconSize = 18;
        const spinnerIcon = [
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[0]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[1]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[2]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[3]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[4]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[5]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[6]).resize({ height: spinnerIconSize }),
            nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER[7]).resize({ height: spinnerIconSize }),
        ];
        // const spinnerIconWide = [
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[0]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[1]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[2]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[3]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[4]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[5]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[6]).resize({ height: spinnerIconSize }),
        //     nativeImage.createFromDataURL(VesTouchBarIcons.SPINNER_WIDE[7]).resize({ height: spinnerIconSize }),
        // ];

        /* const vesButton = new TouchBarButton({
            backgroundColor: '#a22929',
            icon: vesIcon,
            // click: () => app.emit(VesTouchBarCommands.executeCommand, 'core.about'),
            click: () => app.emit(VesTouchBarCommands.executeCommand, 'workbench.action.showCommands'),
        }); */

        const buildMenuCleanButton = new TouchBarButton({
            icon: cleanIcon,
            accessibilityLabel: VesBuildCommands.CLEAN.id,
        });
        const buildMenuBuildButton = new TouchBarButton({
            icon: buildIcon,
            accessibilityLabel: VesBuildCommands.BUILD.id,
        });
        const buildMenuRunButton = new TouchBarButton({
            icon: runIcon,
            accessibilityLabel: VesEmulatorCommands.RUN.id,
        });
        const buildMenuFlashButton = new TouchBarButton({
            icon: flashIcon,
            accessibilityLabel: VesFlashCartCommands.FLASH.id,
        });
        const buildMenuExportButton = new TouchBarButton({
            icon: exportIcon,
            accessibilityLabel: VesExportCommands.EXPORT.id,
        });

        const buildMenuSegmentedControlSegments = [
            buildMenuCleanButton,
            buildMenuBuildButton,
            buildMenuRunButton,
            buildMenuFlashButton,
            buildMenuExportButton,
        ];

        const buildMenuSegmentedControl = new TouchBarSegmentedControl({
            segmentStyle: 'automatic',
            selectedIndex: 0,
            mode: 'buttons',
            segments: buildMenuSegmentedControlSegments,
            change: selectedIndex => app.emit(VesTouchBarCommands.executeCommand, buildMenuSegmentedControlSegments[selectedIndex].accessibilityLabel),
        });

        const buildModes = [{
            label: BuildMode.Release,
        }, {
            label: BuildMode.Beta,
        }, {
            label: BuildMode.Tools,
        }, {
            label: BuildMode.Debug,
        }, {
            label: BuildMode.Preprocessor,
        }];

        const buildModeButtonSegmentedControl = new TouchBarSegmentedControl({
            segmentStyle: 'automatic',
            mode: 'single',
            segments: buildModes,
            selectedIndex: 1,
            change: selectedIndex => app.emit(VesTouchBarCommands.setBuildMode, buildModes[selectedIndex].label),
        });

        const buildModeButton = new TouchBarPopover({
            label: 'Mode',
            showCloseButton: true,
            items: new TouchBar({
                items: [
                    new TouchBarLabel({ label: 'Build Mode:' }),
                    buildModeButtonSegmentedControl
                ]
            }),
        });

        const MenuButton = new TouchBarButton({
            icon: menuIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, 'workbench.action.showCommands'),
        });

        const vesTouchBar = new TouchBar({
            items: [
                // vesButton,
                buildMenuSegmentedControl,
                buildModeButton,
                MenuButton,
            ]
        });

        electronWindow.setTouchBar(vesTouchBar);

        // @ts-ignore
        app.on(VesTouchBarCommands.changeBuildMode, (buildMode: BuildMode) => {
            buildModeButton.label = buildMode.replace('Preprocessor', 'Preproc.');
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeBuildStatus, (buildStatus: BuildStatus) => {
            if (buildStatus.active) {
                if (!spinnerIconIntervall) {
                    spinnerIconIntervall = setInterval(() => animateSpinner(buildMenuBuildButton), 200);
                }
            } else {
                if (spinnerIconIntervall) {
                    clearInterval(spinnerIconIntervall);
                    spinnerIconIntervall = null; /* eslint-disable-line */
                    buildMenuBuildButton.icon = buildIcon;
                    redrawMenuSegmentedControl();
                };
            }
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsRunQueued, (isQueued: boolean) => {
            buildMenuRunButton.icon = isQueued ? queuedIcon : runIcon;
            redrawMenuSegmentedControl();
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsFlashQueued, (isQueued: boolean) => {
            buildMenuFlashButton.icon = isQueued ? queuedIcon : flashIcon;
            redrawMenuSegmentedControl();
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsFlashing, (isFlashing: boolean) => {
            if (isFlashing) {
                if (!spinnerIconIntervall) {
                    spinnerIconIntervall = setInterval(() => animateSpinner(buildMenuFlashButton), 200);
                }
            } else {
                if (spinnerIconIntervall) {
                    clearInterval(spinnerIconIntervall);
                    spinnerIconIntervall = null; /* eslint-disable-line */
                    buildMenuFlashButton.icon = flashIcon;
                    redrawMenuSegmentedControl();
                }
            }
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsExportQueued, (isQueued: boolean) => {
            buildMenuExportButton.icon = isQueued ? queuedIcon : exportIcon;
            redrawMenuSegmentedControl();
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeConnectedFlashCart, flashCartConfig => {
            buildMenuFlashButton.enabled = !!flashCartConfig;
            redrawMenuSegmentedControl();
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeBuildFolder, flags => {
            const buildMode = buildModeButton.label;
            buildMenuCleanButton.enabled = flags[buildMode];
            redrawMenuSegmentedControl();
        });

        const animateSpinner = (button: Electron.TouchBarButton) => {
            spinnerIconFrame++;
            if (spinnerIconFrame >= spinnerIcon.length) {
                spinnerIconFrame = 0;
            };
            button.icon = spinnerIcon[spinnerIconFrame];
            redrawMenuSegmentedControl();
        };

        const redrawMenuSegmentedControl = () => {
            buildMenuSegmentedControl.selectedIndex = 0; // have to update element somehow to trigger redrawing of its children
        };
    }
}
