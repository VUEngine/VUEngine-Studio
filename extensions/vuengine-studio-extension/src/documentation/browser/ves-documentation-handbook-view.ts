import { inject, injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { CommandRegistry } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { VesDocumentationHandbookWidget } from './ves-documentation-Handbook-widget';
import { VesDocumentationCommands } from './ves-documentation-commands';
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
                    let tries = 0;
                    while (!widget && tries < 50) {
                        widget = super.tryGetWidget();
                        tries++;
                        await this.sleep(50);
                    }

                    if (widget) {
                        widget.openDocument(documentUri);
                    }
                }
            },
        });
    }

    private async sleep(ms: number): Promise<unknown> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
