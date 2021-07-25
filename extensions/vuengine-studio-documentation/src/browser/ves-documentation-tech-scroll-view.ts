import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { CommandRegistry } from '@theia/core';

import { VesDocumentationTechScrollWidget } from './ves-documentation-tech-scroll-widget';
import { VesDocumentationCommands } from './ves-documentation-commands';

@injectable()
export class VesDocumentationTechScrollViewContribution extends AbstractViewContribution<VesDocumentationTechScrollWidget> {

    constructor() {
        super({
            widgetId: VesDocumentationTechScrollWidget.ID,
            widgetName: VesDocumentationTechScrollWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(VesDocumentationCommands.OPEN_TECH_SCROLL, {
            execute: () => {
                // TODO: this does not work too well. Just open latest on PVB in external browser?
                super.openView({ activate: false, reveal: true });
            },
        });
    }
}
