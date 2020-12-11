import * as React from 'react';
import { injectable, postConstruct, inject } from 'inversify';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { CommandService, MessageService } from '@theia/core';
import { VesFlashCartsCommand } from "../flash-carts/commands";

@injectable()
export class VesTopbarWidget extends ReactWidget {

    static readonly ID = 'ves-topbar';
    static readonly LABEL = 'Topbar';

    @inject(MessageService)
    protected readonly messageService!: MessageService;
    @inject(CommandService)
    protected readonly commandService!: CommandService;

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = VesTopbarWidget.ID;
        this.title.label = VesTopbarWidget.LABEL;
        this.title.caption = VesTopbarWidget.LABEL;
        this.title.closable = false;
        this.update();
    }

    protected render(): React.ReactNode {
        const { applicationName } = FrontendApplicationConfigProvider.get();
        return <>
            <div className="topbar-buttons">
                <button className="theia-button secondary"><i className="fa fa-trash"></i> Clean</button>
                <button className="theia-button secondary"><i className="fa fa-wrench"></i> Build</button>
                <button className="theia-button secondary"><i className="fa fa-play"></i> Run</button>
                <button className="theia-button secondary" /*onClick={this.commandService.executeCommand(VesFlashCartsCommand.id)}*/><i className="fa fa-usb"></i> Flash</button>
            </div>
            <div id="application-title">[Current Project] — {applicationName}</div>
        </>
    }
}
