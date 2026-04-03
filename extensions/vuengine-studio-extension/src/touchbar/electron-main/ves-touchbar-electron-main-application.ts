import { isOSX, MaybePromise, nls } from '@theia/core';
import { BrowserWindow, nativeImage, TouchBar } from '@theia/core/electron-shared/electron';
import { ElectronMainApplication } from '@theia/core/lib/electron-main/electron-main-application';
import { TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/theia-electron-window';
import { FrontendApplicationConfig } from '@theia/core/shared/@theia/application-package';
import { injectable } from '@theia/core/shared/inversify';
import { NativeImage, SegmentedControlSegment } from 'electron';
import { VesBuildCommands } from '../../build/browser/ves-build-commands';
import { BuildMode, BuildStatus } from '../../build/browser/ves-build-types';
import { VesRendererAPI } from '../../core/electron-main/ves-electron-main-api';
import { EmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesExportCommands } from '../../export/browser/ves-export-commands';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesProjectCommands } from '../../project/browser/ves-project-commands';
import { ViewModeCommands } from '../../viewMode/browser/view-mode-commands';
import { VIEW_MODE_LABELS, ViewMode } from '../../viewMode/browser/view-mode-types';
import { VesTouchBarIcons } from '../common/images/touch-bar-icons';
import { VesTouchBarCommands } from '../common/ves-touchbar-types';

export const VIEW_MODE_TOUCHBAR_ICONS: { [viewMode: string]: NativeImage } = {
    [ViewMode.actors]: nativeImage.createFromDataURL(VesTouchBarIcons.SMILEY).resize({ height: 18 }),
    [ViewMode.assets]: nativeImage.createFromDataURL(VesTouchBarIcons.LIBRARY).resize({ height: 18 }),
    [ViewMode.build]: nativeImage.createFromDataURL(VesTouchBarIcons.SYMBOL_PROPERTY).resize({ height: 18 }),
    [ViewMode.fonts]: nativeImage.createFromDataURL(VesTouchBarIcons.CASE_SENSITIVE).resize({ height: 18 }),
    [ViewMode.localization]: nativeImage.createFromDataURL(VesTouchBarIcons.COMMENT_DISCUSSION).resize({ height: 18 }),
    [ViewMode.logic]: nativeImage.createFromDataURL(VesTouchBarIcons.PULSE).resize({ height: 18 }),
    [ViewMode.sound]: nativeImage.createFromDataURL(VesTouchBarIcons.MUSIC).resize({ height: 18 }),
    [ViewMode.settings]: nativeImage.createFromDataURL(VesTouchBarIcons.SETTINGS).resize({ height: 18 }),
    [ViewMode.sourceCode]: nativeImage.createFromDataURL(VesTouchBarIcons.CODE).resize({ height: 18 }),
    [ViewMode.stages]: nativeImage.createFromDataURL(VesTouchBarIcons.SYMBOL_METHOD).resize({ height: 18 }),
};

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    protected grayscaleCss: string = '';

    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);

        electronWindow.on('focus', async () => this.removeGreyOutWindow(electronWindow));
        electronWindow.on('blur', async () => this.greyOutWindow(electronWindow));

        this.setUpWebUSB(electronWindow);
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.init, workspaceOpened => this.registerVesTouchBar(electronWindow, workspaceOpened));

        return electronWindow;
    }

    protected async greyOutWindow(electronWindow: BrowserWindow): Promise<void> {
        await electronWindow.webContents.removeInsertedCSS(this.grayscaleCss);
        this.grayscaleCss = await electronWindow.webContents.insertCSS('#theia-top-panel { filter: grayscale(1); transition: filter 1s; }');
    }

    protected async removeGreyOutWindow(electronWindow: BrowserWindow): Promise<void> {
        await electronWindow.webContents.removeInsertedCSS(this.grayscaleCss);
        this.grayscaleCss = await electronWindow.webContents.insertCSS('#theia-top-panel { filter: unset; transition: unset; }');
    }

    protected async setUpWebUSB(electronWindow: BrowserWindow): Promise<void> {
        electronWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
            event.preventDefault();
            if (portList && portList.length > 0) {
                callback(portList[0].portId);
            } else {
                callback(''); // Could not find any matching devices
            }
        });

        electronWindow.webContents.session.on('usb-device-added', (evt, device) => {
            VesRendererAPI.sendUsbDeviceChange(electronWindow.webContents);
        });
        electronWindow.webContents.session.on('usb-device-removed', (evt, device) => {
            VesRendererAPI.sendUsbDeviceChange(electronWindow.webContents);
        });

        electronWindow.webContents.session.on('serial-port-added', (evt, device) => {
            VesRendererAPI.sendSerialDeviceChange(electronWindow.webContents);
        });
        electronWindow.webContents.session.on('serial-port-removed', (evt, device) => {
            VesRendererAPI.sendSerialDeviceChange(electronWindow.webContents);
        });

        electronWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) =>
            (['serial', 'usb'].includes(permission) && details.securityOrigin === 'file:///'));

        electronWindow.webContents.session.setDevicePermissionHandler(details =>
            (['serial', 'usb'].includes(details.deviceType) && details.origin === 'file://'));
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

    protected getTitleBarStyle(config: FrontendApplicationConfig): 'native' | 'custom' {
        return 'custom';
    }

    protected registerVesTouchBar(electronWindow: BrowserWindow, workspaceOpened: boolean): void {
        const vesTouchBar = new TouchBar({
            items: workspaceOpened
                ? [
                    ...this.getViewModeMenuButtons(electronWindow),
                    ...this.getBuildMenuButtons(electronWindow),
                ]
                : [
                    ...this.getNoProjectToolbarButtons(electronWindow),
                ]
        });

        electronWindow.setTouchBar(vesTouchBar);
    }

    protected getViewModeMenuButtons(electronWindow: BrowserWindow): Array<Electron.TouchBarButton | Electron.TouchBarPopover | Electron.TouchBarSpacer> {
        const { TouchBarButton, TouchBarSpacer } = TouchBar;

        const viewModeSpacer = new TouchBarSpacer({
            size: 'small',
        });

        const viewModeButton = new TouchBarButton({
            backgroundColor: '#d31422',
            // backgroundColor: this.colorRegistry.getCurrentColor('focusBorder'),
            label: VIEW_MODE_LABELS[ViewMode.sourceCode],
            icon: VIEW_MODE_TOUCHBAR_ICONS[ViewMode.sourceCode],
            iconPosition: 'left',
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, ViewModeCommands.CHANGE_VIEW_MODE.id),
        });

        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeViewMode, (viewMode: ViewMode) => {
            viewModeButton.label = VIEW_MODE_LABELS[viewMode];
            viewModeButton.icon = VIEW_MODE_TOUCHBAR_ICONS[viewMode];
        });

        return [
            viewModeButton,
            viewModeSpacer,
        ];
    }

    protected getBuildMenuButtons(electronWindow: BrowserWindow): Array<Electron.TouchBarButton | Electron.TouchBarPopover | Electron.TouchBarSpacer> {
        const { TouchBarButton, TouchBarLabel, TouchBarPopover, TouchBarSegmentedControl, TouchBarSpacer } = TouchBar;

        const blankIcon = nativeImage.createFromDataURL(VesTouchBarIcons.BLANK).resize({ height: 18 });
        const cleanIcon = nativeImage.createFromDataURL(VesTouchBarIcons.TRASH).resize({ height: 16 });
        const buildIcon = nativeImage.createFromDataURL(VesTouchBarIcons.SYMBOL_PROPERTY).resize({ height: 18 });
        const exportIcon = nativeImage.createFromDataURL(VesTouchBarIcons.DESKTOP_DOWNLOAD).resize({ height: 18 });
        const runIcon = nativeImage.createFromDataURL(VesTouchBarIcons.PLAY).resize({ height: 16 });
        const flashIcon = nativeImage.createFromDataURL(VesTouchBarIcons.CHIP).resize({ height: 18 });
        const queuedIcon = nativeImage.createFromDataURL(VesTouchBarIcons.QUEUED).resize({ height: 16 });

        const buildMenuBuildButton = new TouchBarButton({
            icon: buildIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, VesBuildCommands.BUILD.id),
        });
        const buildMenuRunButton = new TouchBarButton({
            icon: runIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, EmulatorCommands.RUN.id),
        });
        const buildMenuFlashButton = new TouchBarButton({
            icon: flashIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, VesFlashCartCommands.FLASH.id),
        });
        const buildMenuExportButton = new TouchBarButton({
            icon: exportIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, VesExportCommands.EXPORT.id),
        });
        const buildMenuCleanButton = new TouchBarButton({
            icon: cleanIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, VesBuildCommands.CLEAN.id),
        });

        const buildModes: SegmentedControlSegment[] = Object.keys(BuildMode).map(m => ({
            label: m,
        }));

        const buildModeButtonSegmentedControl = new TouchBarSegmentedControl({
            segmentStyle: 'automatic',
            mode: 'single',
            segments: buildModes,
            selectedIndex: 1,
            change: (selectedIndex: number) => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.setBuildMode, buildModes[selectedIndex].label),
        });

        const buildMenuSpacer = new TouchBarSpacer({
            size: 'small',
        });

        const buildModeButton = new TouchBarPopover({
            label: nls.localize('vuengine/build/buildMode', 'Build Mode'),
            showCloseButton: true,
            items: new TouchBar({
                items: [
                    new TouchBarLabel({ label: nls.localize('vuengine/build/buildMode', 'Build Mode') }),
                    buildModeButtonSegmentedControl
                ]
            }),
        });

        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeBuildIsQueued, (isQueued: boolean) => {
            buildMenuBuildButton.label = '';
            buildMenuBuildButton.icon = isQueued ? queuedIcon : buildIcon;
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeBuildStatus, (buildStatus: BuildStatus) => {
            if (buildStatus.active) {
                buildMenuBuildButton.label = `${buildStatus.progress}%`;
                buildMenuBuildButton.icon = blankIcon;
            } else {
                buildMenuBuildButton.label = '';
                buildMenuBuildButton.icon = buildIcon;
            }
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeIsRunQueued, (isQueued: boolean) => {
            buildMenuRunButton.label = '';
            buildMenuRunButton.icon = isQueued ? queuedIcon : runIcon;
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeIsFlashQueued, (isQueued: boolean) => {
            buildMenuFlashButton.label = '';
            buildMenuFlashButton.icon = isQueued ? queuedIcon : flashIcon;
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeIsFlashing, (isFlashing: boolean) => {
            if (isFlashing) {
                buildMenuFlashButton.label = '0%';
                buildMenuFlashButton.icon = blankIcon;
            } else {
                buildMenuFlashButton.label = '';
                buildMenuFlashButton.icon = flashIcon;
            }
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.onDidChangeFlashingProgress, (progress: number) => {
            buildMenuFlashButton.label = progress > -1 ? `${progress}%` : '';
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeConnectedFlashCart, flashCartConfig => {
            buildMenuFlashButton.enabled = !!flashCartConfig;
        });
        VesRendererAPI.onTouchBarCommand(electronWindow.webContents, VesTouchBarCommands.changeBuildMode, (buildMode: BuildMode) => {
            buildModeButton.label = buildMode;
        });

        return [
            buildMenuBuildButton,
            buildMenuRunButton,
            buildMenuFlashButton,
            buildMenuExportButton,
            buildMenuCleanButton,
            buildMenuSpacer,
            buildModeButton,
        ];
    }

    protected getNoProjectToolbarButtons(electronWindow: BrowserWindow): Array<Electron.TouchBarButton> {
        const { TouchBarButton } = TouchBar;

        const newProjectIcon = nativeImage.createFromDataURL(VesTouchBarIcons.ADD).resize({ height: 18 });
        const openIcon = nativeImage.createFromDataURL(VesTouchBarIcons.FOLDER_OPENED).resize({ height: 18 });
        const openWorkspaceIcon = nativeImage.createFromDataURL(VesTouchBarIcons.FOLDER_LIBRARY).resize({ height: 18 });
        const repoCloneIcon = nativeImage.createFromDataURL(VesTouchBarIcons.REPO_CLONE).resize({ height: 18 });

        const newProjectButton = new TouchBarButton({
            icon: newProjectIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, VesProjectCommands.NEW.id),
        });
        const openButton = new TouchBarButton({
            icon: openIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, isOSX
                ? 'workspace:open'
                : 'workspace:openFolder'),
        });
        const openWorkspaceButton = new TouchBarButton({
            icon: openWorkspaceIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, 'workspace:openWorkspace'),
        });
        const repoCloneButton = new TouchBarButton({
            icon: repoCloneIcon,
            click: () => VesRendererAPI.sendTouchBarEvent(electronWindow.webContents, VesTouchBarCommands.executeCommand, 'git.clone'),
        });

        return [
            openWorkspaceButton,
            openButton,
            repoCloneButton,
            newProjectButton,
        ];
    }
}
