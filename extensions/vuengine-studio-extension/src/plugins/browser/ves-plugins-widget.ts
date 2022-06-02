import { nls } from '@theia/core';
import { TreeNode } from '@theia/core/lib/browser';
import { SourceTreeWidget } from '@theia/core/lib/browser/source-tree';
import { inject, injectable, interfaces, postConstruct } from '@theia/core/shared/inversify';
import { VesPluginsSource, VesPluginsSourceOptions } from './ves-plugins-source';

@injectable()
export class VesPluginsWidgetOptions extends VesPluginsSourceOptions {
    title?: string;
}

export const generateWidgetId = (widgetId: string): string => VesPluginsWidget.ID + ':' + widgetId;

@injectable()
export class VesPluginsWidget extends SourceTreeWidget {
    static ID = 'ves-plugins';

    static createWidget(parent: interfaces.Container, options: VesPluginsWidgetOptions): VesPluginsWidget {
        const child = SourceTreeWidget.createContainer(parent, {
            virtualized: false,
            scrollIfActive: true
        });
        child.bind(VesPluginsSourceOptions).toConstantValue(options);
        child.bind(VesPluginsSource).toSelf();
        child.unbind(SourceTreeWidget);
        child.bind(VesPluginsWidgetOptions).toConstantValue(options);
        child.bind(VesPluginsWidget).toSelf();
        return child.get(VesPluginsWidget);
    }

    @inject(VesPluginsWidgetOptions)
    protected readonly options: VesPluginsWidgetOptions;

    @inject(VesPluginsSource)
    protected readonly pluginsSource: VesPluginsSource;

    @postConstruct()
    protected init(): void {
        super.init();
        this.addClass('ves-plugins');

        this.id = generateWidgetId(this.options.id);

        this.toDispose.push(this.pluginsSource);
        this.source = this.pluginsSource;

        this.computeTitle();

        this.toDispose.push(this.source.onDidChange(() => {
            this.computeTitle();
        }));
    }

    protected async computeTitle(): Promise<void> {
        const countLabel = await this.resolveCountLabel();
        let label = '';
        switch (this.options.id) {
            case VesPluginsSourceOptions.INSTALLED:
                label = nls.localize('vuengine/plugins/installed', 'Installed');
                break;
            case VesPluginsSourceOptions.RECOMMENDED:
                label = nls.localize('vuengine/plugins/recommended', 'Recommended');
                break;
            case VesPluginsSourceOptions.SEARCH_RESULT:
                label = nls.localize('vuengine/plugins/search', 'Search');
                break;
        }

        const title = `${label} ${countLabel}`;
        this.title.label = title;
        this.title.caption = title;
    }

    protected async resolveCountLabel(): Promise<string> {
        let label = '';
        if (this.options.id !== VesPluginsSourceOptions.SEARCH_RESULT) {
            const elements = await this.source?.getElements() || [];
            label = `(${[...elements].length})`;
        }
        return label;
    }

    protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        super.handleClickEvent(node, event);
        this.model.openNode(node); // Open the editor view on a single click.
    }

    protected handleDblClickEvent(): void {
        // Don't open the editor view on a double click.
    }
}
