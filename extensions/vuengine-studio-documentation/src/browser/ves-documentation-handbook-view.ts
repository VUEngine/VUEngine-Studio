import { injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { CommandRegistry } from '@theia/core';

import { VesDocumentationHandbookWidget } from './ves-documentation-Handbook-widget';
import { VesDocumentationCommands } from './ves-documentation-commands';

@injectable()
export class VesDocumentationHandbookViewContribution extends AbstractViewContribution<VesDocumentationHandbookWidget> {

    constructor() {
        super({
            widgetId: VesDocumentationHandbookWidget.ID,
            widgetName: VesDocumentationHandbookWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(VesDocumentationCommands.OPEN_HANDBOOK, {
            execute: () => super.openView({ activate: false, reveal: true })
        });
    }
}
