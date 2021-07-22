import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';

import { VesDocumentationIFrameWidget } from './ves-documentation-iframe-widget';
import { CommandRegistry } from '@theia/core';
import { VesDocumentationCommands } from './ves-documentation-commands';

@injectable()
export class VesDocumentationIFrameViewContribution extends AbstractViewContribution<VesDocumentationIFrameWidget> {

    constructor() {
        super({
            widgetId: VesDocumentationIFrameWidget.ID,
            widgetName: VesDocumentationIFrameWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(VesDocumentationCommands.OPEN_TECH_SCROLL, {
            execute: () => super.openView({ activate: false, reveal: true })
        });
    }
}
