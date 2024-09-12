import { CommandService, Emitter } from '@theia/core';
import { ApplicationShell, CommonCommands, Widget } from '@theia/core/lib/browser';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
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
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;

    protected _isMaximized: Widget | false = false;
    protected readonly onDidChangeIsMaximizedEmitter = new Emitter<Widget | false>();
    readonly onDidChangeIsMaximized = this.onDidChangeIsMaximizedEmitter.event;
    set isMaximized(flag: Widget | false) {
        this._isMaximized = flag;
        this.onDidChangeIsMaximizedEmitter.fire(this._isMaximized);
    }
    get isMaximized(): Widget | false {
        return this._isMaximized;
    }

    @postConstruct()
    protected init(): void {
        this.id = VesTitlebarActionButtonsWidget.ID;
        this.title.label = VesTitlebarActionButtonsWidget.LABEL;
        this.title.caption = VesTitlebarActionButtonsWidget.LABEL;
        this.title.closable = false;
        this.onDidChangeIsMaximized(() => this.update());

        this.update();

        this.frontendApplicationStateService.onStateChanged((state: FrontendApplicationState) => {
            if (state === 'attached_shell') {
                this.update();
            };
        });

        this.applicationShell.mainPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
        this.applicationShell.bottomPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
        this.applicationShell.leftPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
        this.applicationShell.rightPanelHandler.dockPanel.onDidToggleMaximized(widget => this.handleToggleMaximized(widget));
    }

    protected handleToggleMaximized(widget: Widget): void {
        this.isMaximized = !this.isMaximized && widget;
    }

    protected render(): React.ReactNode {
        return <>
            {this.isMaximized &&
                <div
                    className="titlebar-action-button"
                    title={`${CommonCommands.TOGGLE_MAXIMIZED.label}${this.vesCommonService.getKeybindingLabel(CommonCommands.TOGGLE_MAXIMIZED.id, true)}`}
                    onClick={this.collapse}
                >
                    <i className="fa fa-compress"></i>
                </div>}
        </>;
    }

    protected collapse = async () => this.commandService.executeCommand(CommonCommands.TOGGLE_MAXIMIZED.id, this.isMaximized);
}
