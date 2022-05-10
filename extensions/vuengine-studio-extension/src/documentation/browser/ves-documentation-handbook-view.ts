import { inject, injectable } from '@theia/core/shared/inversify';
import { AbstractViewContribution } from '@theia/core/lib/browser';
import { CommandRegistry } from '@theia/core';
import { VesDocumentationHandbookWidget } from './ves-documentation-handbook-widget';
import { VesDocumentationCommands } from './ves-documentation-commands';
import { VesDocumentationTreeViewContribution } from './tree/ves-documentation-tree-view-contribution';
import { VesDocumentationService } from './ves-documentation-service';

@injectable()
export class VesDocumentationHandbookViewContribution extends AbstractViewContribution<VesDocumentationHandbookWidget> {
    @inject(VesDocumentationService)
    protected readonly vesDocumentationService: VesDocumentationService;
    @inject(VesDocumentationTreeViewContribution)
    protected readonly vesDocumentationTreeViewContribution: VesDocumentationTreeViewContribution;

    constructor() {
        super({
            widgetId: VesDocumentationHandbookWidget.ID,
            widgetName: VesDocumentationHandbookWidget.LABEL,
            defaultWidgetOptions: { area: 'main' },
        });
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(VesDocumentationCommands.OPEN_HANDBOOK, {
            execute: async (document?: string, openView?: boolean) => {
                if (openView !== false) {
                    this.vesDocumentationTreeViewContribution.openView({ reveal: true });
                }
                if (document !== undefined && document !== '') {
                    super.openView({ activate: false, reveal: true });

                    let widget = super.tryGetWidget();
                    let tries = 0;
                    while (!widget && tries < 50) {
                        widget = super.tryGetWidget();
                        tries++;
                        await this.sleep(50);
                    }

                    if (widget) {
                        const documentUri = await this.vesDocumentationService.getHandbookUri(document);
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
