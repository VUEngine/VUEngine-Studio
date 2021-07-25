import { inject, injectable } from 'inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { CommandRegistry } from '@theia/core';

import { VesDocumentationHandbookWidget } from './ves-documentation-Handbook-widget';
import { VesDocumentationCommands } from './ves-documentation-commands';
import URI from '@theia/core/lib/common/uri';
import { VesDocumentationTreeViewContribution } from './tree/ves-documentation-tree-view-contribution';

@injectable()
export class VesDocumentationHandbookViewContribution extends AbstractViewContribution<VesDocumentationHandbookWidget> {
    @inject(VesDocumentationTreeViewContribution) protected readonly vesDocumentationTreeViewContribution: VesDocumentationTreeViewContribution;

    constructor() {
        super({
            widgetId: VesDocumentationHandbookWidget.ID,
            widgetName: VesDocumentationHandbookWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(VesDocumentationCommands.OPEN_HANDBOOK, {
            execute: async (documentUri?: URI) => {
                this.vesDocumentationTreeViewContribution.openView({ reveal: true });
                if (documentUri) {
                    super.openView({ activate: false, reveal: true });
                    let widget = super.tryGetWidget();
                    if (widget) {
                        widget.openDocument(documentUri);
                    } else {
                        // TODO: retry a few times instead of only once
                        setTimeout(() => {
                            widget = super.tryGetWidget();
                            widget?.openDocument(documentUri);
                        }, 300);
                    }
                }
            },
        });
    }
}
