import { CommandService } from '@theia/core';
import { ApplicationShell, CommonCommands, MAXIMIZED_CLASS } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesCommonService } from '../../../core/browser/ves-common-service';

@injectable()
export class VesTitlebarActionButtonsWidget extends ReactWidget {

    static readonly ID = 'ves-titlebar-action-buttons';
    static readonly LABEL = 'Titlebar Action Buttons';

    @inject(ApplicationShell)
    protected applicationShell: ApplicationShell;
    @inject(CommandService)
    protected readonly commandService!: CommandService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;

    protected isMaximized: boolean = false;

    @postConstruct()
    protected init(): void {
        this.id = VesTitlebarActionButtonsWidget.ID;
        this.title.label = VesTitlebarActionButtonsWidget.LABEL;
        this.title.caption = VesTitlebarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.applicationShell.onDidToggleMaximized(max => {
            this.isMaximized = max.hasClass(MAXIMIZED_CLASS);
            this.update();
        });

        this.update();
    }

    protected render(): React.ReactNode {
        return (
            <div
                className="titlebar-action-button"
                title={`${CommonCommands.TOGGLE_MAXIMIZED.label}${this.vesCommonService.getKeybindingLabel(CommonCommands.TOGGLE_MAXIMIZED.id, true)}`}
                onClick={this.collapse}
                style={{
                    display: !this.isMaximized ? 'none' : undefined,
                }}
            >
                <i className="fa fa-compress"></i>
            </div>
        );
    }

    protected collapse = async () => this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id, this.isMaximized);
}
