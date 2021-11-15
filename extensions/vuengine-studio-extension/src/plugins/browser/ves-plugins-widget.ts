import { injectable, interfaces, postConstruct, inject } from '@theia/core/shared/inversify';
import { SourceTreeWidget } from '@theia/core/lib/browser/source-tree';
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
        const title = this.options.title ?? this.computeTitle();
        this.title.label = title;
        this.title.caption = title;

        this.toDispose.push(this.pluginsSource);
        this.source = this.pluginsSource;
    }

    protected computeTitle(): string {
        switch (this.options.id) {
            case VesPluginsSourceOptions.INSTALLED:
                return 'Installed';
            case VesPluginsSourceOptions.RECOMMENDED:
                return 'Recommended';
            case VesPluginsSourceOptions.SEARCH_RESULT:
                return 'Search';
            default:
                return '';
        }
    }
}
