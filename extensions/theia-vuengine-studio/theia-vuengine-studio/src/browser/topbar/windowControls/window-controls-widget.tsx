import * as React from 'react';
import { injectable, postConstruct } from 'inversify';
const remote = require('electron').remote;
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';

@injectable()
export class VesTopbarWindowControlsWidget extends ReactWidget {

    static readonly ID = 'ves-topbar-window-controls';
    static readonly LABEL = 'Topbar Window Controls';

    // @inject(MessageService)
    // protected readonly messageService!: MessageService;
    // @inject(CommandService)
    // protected readonly commandService!: CommandService;
    // @inject(WorkspaceService)
    // protected readonly workspaceService!: WorkspaceService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarWindowControlsWidget.ID;
        this.title.label = VesTopbarWindowControlsWidget.LABEL;
        this.title.caption = VesTopbarWindowControlsWidget.LABEL;
        this.title.closable = false;
        this.update();
    }

    protected render(): React.ReactNode {
        const win = remote.getCurrentWindow();
        return <>
            <div className="topbar-window-controls-separator"></div>
            <div
                className="topbar-window-controls-button"
                id="ves-topbar-window-controls-minimize"
                onClick={win.minimize}
            >
                <i className="fa fa-window-minimize"></i>
            </div>
            {!win.isMaximized() &&
                <div
                    className="topbar-window-controls-button"
                    id="ves-topbar-window-controls-maximize"
                    onClick={win.maximize}
                >
                    <i className="fa fa-window-maximize"></i>
                </div>
            }
            {win.isMaximized() &&
                <div
                    className="topbar-window-controls-button"
                    id="ves-topbar-window-controls-restore"
                    onClick={win.unmaximize}
                >
                    <i className="fa fa-window-restore"></i>
                </div>
            }
            <div
                className="topbar-window-controls-button"
                id="ves-topbar-window-controls-close"
                onClick={win.close}
            >
                <i className="fa fa-times"></i>
            </div>
        </>;
    }
}
