import { injectable } from 'inversify';
import { app, BrowserWindow, nativeImage, TouchBar } from 'electron';
import { ElectronMainApplication, TheiaBrowserWindowOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { isOSX, MaybePromise } from '@theia/core';

@injectable()
export class VesElectronMainApplication extends ElectronMainApplication {
    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultBrowserWindowOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);
        // electronWindow.on('focus', () => electronWindow.setOpacity(1));
        // electronWindow.on('blur', () => electronWindow.setOpacity(0.95));
        this.registerVesTouchBar(electronWindow);
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

    protected registerVesTouchBar(electronWindow: BrowserWindow) {
        const { TouchBarButton, TouchBarGroup } = TouchBar;

        const cleanButton = new TouchBarButton({
            label: "🗑",
            accessibilityLabel: "Clean",
            click: () => app.emit("ves-cmd-clean"),
        });

        const buildButton = new TouchBarButton({
            label: "🔧",
            accessibilityLabel: "Build",
            click: () => app.emit("ves-cmd-build"),
        });

        const runButton = new TouchBarButton({
            icon: nativeImage.createFromDataURL(`data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABhWlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9bpUUqDhYUdchQnSyIioiTVqEIFUKt0KqDyaVf0KQhSXFxFFwLDn4sVh1cnHV1cBUEwQ8QJ0cnRRcp8X9JoUWMB8f9eHfvcfcO8NfLTDU7xgBVs4xUIi5ksqtC8BVhDKIPIcxIzNTnRDEJz/F1Dx9f72I8y/vcn6NbyZkM8AnEs0w3LOIN4qlNS+e8TxxhRUkhPiceNeiCxI9cl11+41xw2M8zI0Y6NU8cIRYKbSy3MSsaKvEkcVRRNcr3Z1xWOG9xVstV1rwnf2E4p60sc53mEBJYxBJECJBRRQllWIjRqpFiIkX7cQ//gOMXySWTqwRGjgVUoEJy/OB/8LtbMz8x7iaF40Dni21/DAPBXaBRs+3vY9tunACBZ+BKa/krdWD6k/RaS4seAT3bwMV1S5P3gMsdoP9JlwzJkQI0/fk88H5G35QFem+BrjW3t+Y+Th+ANHWVvAEODoGRAmWve7w71N7bv2ea/f0Aqg1yvdTHMhoAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAADdcAAA3XAUIom3gAAAAHdElNRQfkDBsXCzNGpMODAAAAyUlEQVQ4y6WTPWqCQRRFjxJ0A5am+jqzEjsbsVDIPoJByDKyAl2ClYUuQRS00w1YpAgoHJsJGUTH+fTCgwePc3l3flC5U3V1pG7VX3Ucz3Pghf/aqUUZg88UnGOwigy+LmaFOnkhrWbUt6K+AGZAo6KmDJbAW+h/gCmwBt6BV2CTWr+nHk1r+Aw8V+u58FFdqodwsB9q7dotdK/AJ7V/K+pTcGzwEPxn0LmRuZfxT0Ddq9+hSsEq1YuHcwIGwIRcqe2wxS7EoUydAdFUvsbdGwNTAAAAAElFTkSuQmCC`).resize({
                width: 16,
                height: 16,
            }),
            accessibilityLabel: "Run",
            click: () => app.emit("ves-cmd-run"),
        });

        const flashButton = new TouchBarButton({
            label: "Flash",
            accessibilityLabel: "Flash",
            click: () => app.emit("ves-cmd-flash"),
        });

        const exportButton = new TouchBarButton({
            label: "Export",
            accessibilityLabel: "Export",
            click: () => app.emit("ves-cmd-export"),
        });

        const buildTouchBarGroup = new TouchBarGroup({
            items: new TouchBar({
                items: [
                    cleanButton,
                    buildButton,
                    runButton,
                    flashButton,
                    exportButton
                ]
            })
        });

        const vesTouchBar = new TouchBar({
            items: [
                buildTouchBarGroup,
            ]
        });

        electronWindow.setTouchBar(vesTouchBar);
    }
}
