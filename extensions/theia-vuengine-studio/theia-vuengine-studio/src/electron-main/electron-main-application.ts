import { injectable } from 'inversify';
import { BrowserWindow/*, nativeImage, TouchBar*/ } from 'electron';
import { ElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { isOSX, MaybePromise } from '@theia/core';
//import { VesStateModel } from '../browser/common/vesStateModel';
//import { VesBuildCommand } from '../browser/build/commands';

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    //@inject(VesStateModel) protected readonly vesState: VesStateModel;
    //@inject(CommandService) protected readonly commandService!: CommandService;

    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultBrowserWindowOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);
        // electronWindow.on('focus', () => electronWindow.setOpacity(1));
        // electronWindow.on('blur', () => electronWindow.setOpacity(0.95));
        // this.registerVesTouchBar(electronWindow);
        return electronWindow;
    }

    protected async getDefaultBrowserWindowOptions(): Promise<TheiaBrowserWindowOptions> {
        return {
            ...await super.getDefaultBrowserWindowOptions(),
            backgroundColor: "#222",
            frame: isOSX,
            minHeight: 420,
            minWidth: 820,
            titleBarStyle: "hiddenInset"
        }
    }

    // protected registerVesTouchBar(electronWindow: BrowserWindow) {
    //     const { TouchBarButton, TouchBarGroup } = TouchBar;

    //     const runIcon = nativeImage.createFromDataURL("data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJwbGF5IiBjbGFzcz0ic3ZnLWlubGluZS0tZmEgZmEtcGxheSBmYS13LTE0IiByb2xlPSJpbWciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ0OCA1MTIiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTQyNC40IDIxNC43TDcyLjQgNi42QzQzLjgtMTAuMyAwIDYuMSAwIDQ3LjlWNDY0YzAgMzcuNSA0MC43IDYwLjEgNzIuNCA0MS4zbDM1Mi0yMDhjMzEuNC0xOC41IDMxLjUtNjQuMSAwLTgyLjZ6Ij48L3BhdGg+PC9zdmc+").resize({ height: 30 });
    //     console.log("IMG WATTAFOCK", runIcon.isEmpty, runIcon.isTemplateImage());


    //     const cleanButton = new TouchBarButton({
    //         label: "Clean",
    //         icon: runIcon,
    //         accessibilityLabel: "Clean",
    //         //click: () => this.handleVesTouchBarBuildOnClick()
    //     });

    //     const buildButton = new TouchBarButton({
    //         label: "Build",
    //         icon: "fa fa-wrench",
    //         accessibilityLabel: "Build",
    //         //backgroundColor: "#3b2576",
    //         //click: () => this.handleVesTouchBarBuildOnClick()
    //     });

    //     const runButton = new TouchBarButton({
    //         label: "Run",
    //         icon: "fa fa-run",
    //         accessibilityLabel: "Run",
    //         //backgroundColor: "#3b2576",
    //         //click: () => this.handleVesTouchBarBuildOnClick()
    //     });

    //     const buildTouchBarGroup = new TouchBarGroup({
    //         items: new TouchBar({
    //             items: [
    //                 cleanButton,
    //                 buildButton,
    //                 runButton,
    //             ]
    //         })
    //     });

    //     const vesTouchBar = new TouchBar({
    //         items: [
    //             buildTouchBarGroup,
    //         ]
    //     });


    //     electronWindow.setTouchBar(vesTouchBar);
    // }

    // protected handleVesTouchBarBuildOnClick = () => {
    //     //this.commandService.executeCommand(VesBuildCommand.id);
    // };
}
