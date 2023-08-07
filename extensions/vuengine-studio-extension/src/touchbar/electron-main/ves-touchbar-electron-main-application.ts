import { isOSX, MaybePromise, nls } from '@theia/core';
import { app, BrowserWindow, nativeImage, TouchBar } from '@theia/core/electron-shared/electron';
import { ElectronMainApplication } from '@theia/core/lib/electron-main/electron-main-application';
import { TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/theia-electron-window';
import { injectable } from '@theia/core/shared/inversify';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { BuildMode } from '../../build/browser/ves-build-types';
import { VesEmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';
import { VesTouchBarCommands } from '../common/ves-touchbar-types';
import { VesTouchBarIcons } from './images/touch-bar-icons';
// import IMAGE_BLANK from '../../../src/touchbar/electron-main/images/blank.png';
// import IMAGE_VES from '../../../src/touchbar/electron-main/images/ves.png';
// import IMAGE_CLEAN from '../../../src/touchbar/electron-main/images/clean.png';
// import IMAGE_BUILD from '../../../src/touchbar/electron-main/images/build.png';
// import IMAGE_RUN from '../../../src/touchbar/electron-main/images/run.png';
// import IMAGE_FLASH from '../../../src/touchbar/electron-main/images/flash.png';
// import IMAGE_EXPORT from '../../../src/touchbar/electron-main/images/export.png';
// import IMAGE_MENU from '../../../src/touchbar/electron-main/images/menu.png';
// import IMAGE_QUEUED from '../../../src/touchbar/electron-main/images/queued.png';
// import IMAGE_PLUS from '../../../src/touchbar/electron-main/images/plus.png';
// import IMAGE_OPEN_FOLDER from '../../../src/touchbar/electron-main/images/open-folder.png';
// import IMAGE_FILE_CODE from '../../../src/touchbar/electron-main/images/file-code.png';

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    protected grayscaleCss: string = '';

    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);

        // electronWindow.on('focus', async () => this.removeGreyOutWindow(electronWindow));
        // electronWindow.on('blur', async () => this.greyOutWindow(electronWindow));

        // @ts-ignore
        app.on(VesTouchBarCommands.init, workspaceOpened => this.registerVesTouchBar(electronWindow, workspaceOpened));

        return electronWindow;
    }

    protected async greyOutWindow(electronWindow: BrowserWindow): Promise<void> {
        await electronWindow.webContents.removeInsertedCSS(this.grayscaleCss);
        this.grayscaleCss = await electronWindow.webContents.insertCSS('html { filter: grayscale(1); transition: filter 1s; }');
    }

    protected async removeGreyOutWindow(electronWindow: BrowserWindow): Promise<void> {
        await electronWindow.webContents.removeInsertedCSS(this.grayscaleCss);
        this.grayscaleCss = await electronWindow.webContents.insertCSS('html { filter: unset; transition: unset; }');
    }

    protected getDefaultOptions(): TheiaBrowserWindowOptions {
        return {
            ...super.getDefaultOptions(),
            backgroundColor: '#222',
            frame: isOSX,
            minHeight: 600,
            minWidth: 850,
            titleBarStyle: 'hiddenInset'
        };
    }

    protected registerVesTouchBar(electronWindow: BrowserWindow, workspaceOpened: boolean): void {
        const { TouchBarButton } = TouchBar;

        const vesIcon = nativeImage.createFromDataURL(VesTouchBarIcons.VES).resize({ height: 16 });

        const vesButton = new TouchBarButton({
            backgroundColor: '#a22929',
            icon: vesIcon,
            // click: () => app.emit(VesTouchBarCommands.executeCommand, 'core.about'),
            click: () => app.emit(VesTouchBarCommands.executeCommand, 'workbench.action.showCommands'),
        });

        const vesTouchBar = new TouchBar({
            items: workspaceOpened
                ? [
                    vesButton,
                    ...this.getProjectToolbarButtons(),
                ]
                : [
                    vesButton,
                    ...this.getNoProjectToolbarButtons(),
                ]
        });

        electronWindow.setTouchBar(vesTouchBar);
    }

    protected getProjectToolbarButtons(): Array<Electron.TouchBarButton | Electron.TouchBarPopover | Electron.TouchBarSpacer> {
        const { TouchBarButton, TouchBarLabel, TouchBarPopover, TouchBarSegmentedControl, TouchBarSpacer } = TouchBar;

        const blankIcon = nativeImage.createFromDataURL(VesTouchBarIcons.BLANK).resize({ height: 18 });
        const cleanIcon = nativeImage.createFromDataURL(VesTouchBarIcons.CLEAN).resize({ height: 16 });
        const buildIcon = nativeImage.createFromDataURL(VesTouchBarIcons.BUILD).resize({ height: 18 });
        const runIcon = nativeImage.createFromDataURL(VesTouchBarIcons.RUN).resize({ height: 16 });
        const flashIcon = nativeImage.createFromDataURL(VesTouchBarIcons.FLASH).resize({ height: 18 });
        const queuedIcon = nativeImage.createFromDataURL(VesTouchBarIcons.QUEUED).resize({ height: 16 });

        const buildMenuBuildButton = new TouchBarButton({
            icon: buildIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, VesBuildCommands.BUILD.id),
        });
        const buildMenuRunButton = new TouchBarButton({
            icon: runIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, VesEmulatorCommands.RUN.id),
        });
        const buildMenuFlashButton = new TouchBarButton({
            icon: flashIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, VesFlashCartCommands.FLASH.id),
        });
        const buildMenuCleanButton = new TouchBarButton({
            icon: cleanIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, VesBuildCommands.CLEAN.id),
        });

        const buildModes = [{
            label: BuildMode.Release,
        }, {
            label: BuildMode.Beta,
        }, {
            label: BuildMode.Tools,
        }, {
            label: BuildMode.Debug,
        }];

        const buildModeButtonSegmentedControl = new TouchBarSegmentedControl({
            segmentStyle: 'automatic',
            mode: 'single',
            segments: buildModes,
            selectedIndex: 1,
            change: (selectedIndex: number) => app.emit(VesTouchBarCommands.setBuildMode, buildModes[selectedIndex].label),
        });

        const buildMenuSpacer = new TouchBarSpacer({
            size: 'large',
        });

        const buildModeButton = new TouchBarPopover({
            label: nls.localize('vuengine/build/mode', 'Mode'),
            showCloseButton: true,
            items: new TouchBar({
                items: [
                    new TouchBarLabel({ label: nls.localize('vuengine/build/buildMode', 'Build Mode') }),
                    buildModeButtonSegmentedControl
                ]
            }),
        });

        // @ts-ignore
        app.on(VesTouchBarCommands.changeBuildIsQueued, (isQueued: boolean) => {
            buildMenuBuildButton.label = '';
            buildMenuBuildButton.icon = isQueued ? queuedIcon : buildIcon;
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeBuildStatus, (buildStatus: BuildStatus) => {
            if (buildStatus.active) {
                buildMenuBuildButton.label = `${buildStatus.progress}%`;
                buildMenuBuildButton.icon = blankIcon;
            } else {
                buildMenuBuildButton.label = '';
                buildMenuBuildButton.icon = buildIcon;
            }
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsRunQueued, (isQueued: boolean) => {
            buildMenuRunButton.label = '';
            buildMenuRunButton.icon = isQueued ? queuedIcon : runIcon;
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsFlashQueued, (isQueued: boolean) => {
            buildMenuFlashButton.label = '';
            buildMenuFlashButton.icon = isQueued ? queuedIcon : flashIcon;
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeIsFlashing, (isFlashing: boolean) => {
            if (isFlashing) {
                buildMenuFlashButton.label = '0%';
                buildMenuFlashButton.icon = blankIcon;
            } else {
                buildMenuFlashButton.label = '';
                buildMenuFlashButton.icon = flashIcon;
            }
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.onDidChangeFlashingProgress, (progress: number) => {
            buildMenuFlashButton.label = progress > -1 ? `${progress}%` : '';
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeConnectedFlashCart, flashCartConfig => {
            buildMenuFlashButton.enabled = !!flashCartConfig;
        });
        // @ts-ignore
        app.on(VesTouchBarCommands.changeBuildMode, (buildMode: BuildMode) => {
            buildModeButton.label = buildMode;
        });

        return [
            buildMenuBuildButton,
            buildMenuRunButton,
            buildMenuFlashButton,
            buildMenuCleanButton,
            buildMenuSpacer,
            buildModeButton,
        ];
    }

    protected getNoProjectToolbarButtons(): Array<Electron.TouchBarButton> {
        const { TouchBarButton } = TouchBar;

        const newProjectIcon = nativeImage.createFromDataURL(VesTouchBarIcons.PLUS).resize({ height: 18 });
        const openIcon = nativeImage.createFromDataURL(VesTouchBarIcons.OPEN_FOLDER).resize({ height: 18 });
        const openWorkspaceIcon = nativeImage.createFromDataURL(VesTouchBarIcons.FILE_CODE).resize({ height: 18 });

        const newProjectButton = new TouchBarButton({
            icon: newProjectIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, VesProjectCommands.NEW.id),
        });
        const openButton = new TouchBarButton({
            icon: openIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, isOSX
                ? 'workspace:open'
                : 'workspace:openFolder'),
        });
        const openWorkspaceButton = new TouchBarButton({
            icon: openWorkspaceIcon,
            click: () => app.emit(VesTouchBarCommands.executeCommand, 'workspace:openWorkspace'),
        });

        return [
            newProjectButton,
            openButton,
            openWorkspaceButton,
        ];
    }
}
