import * as React from '@theia/core/shared/react';
import * as DOMPurify from '@theia/core/shared/dompurify';
import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { TreeElement } from '@theia/core/lib/browser/source-tree';
import { OpenerService, open, OpenerOptions } from '@theia/core/lib/browser/opener-service';
import { HostedPluginSupport } from '@theia/plugin-ext/lib/hosted/browser/hosted-plugin';
import { PluginServer, DeployedPlugin, PluginType } from '@theia/plugin-ext/lib/common/plugin-protocol';
import { ProgressService } from '@theia/core/lib/common/progress-service';
import { Endpoint } from '@theia/core/lib/browser/endpoint';
import { MenuPath } from '@theia/core/lib/common';
import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { VesPluginsSearchModel } from './ves-plugins-search-model';

export const PLUGINS_CONTEXT_MENU: MenuPath = ['plugins_context_menu'];

export namespace VesPluginsContextMenu {
    export const COPY = [...PLUGINS_CONTEXT_MENU, '1_copy'];
}

@injectable()
export class VesPluginData {
    readonly version?: string;
    readonly iconUrl?: string;
    readonly publisher?: string;
    readonly name?: string;
    readonly displayName?: string;
    readonly description?: string;
    readonly averageRating?: number;
    readonly downloadCount?: number;
    readonly downloadUrl?: string;
    readonly readmeUrl?: string;
    readonly licenseUrl?: string;
    readonly repository?: string;
    readonly license?: string;
    readonly readme?: string;
    readonly preview?: boolean;
    readonly publishedBy?: string;
    static KEYS: Set<(keyof VesPluginData)> = new Set([
        'version',
        'iconUrl',
        'publisher',
        'name',
        'displayName',
        'description',
        'averageRating',
        'downloadCount',
        'downloadUrl',
        'readmeUrl',
        'licenseUrl',
        'repository',
        'license',
        'readme',
        'preview',
        'publishedBy'
    ]);
}

@injectable()
export class VesPluginOptions {
    readonly id: string;
}

export const VesPluginFactory = Symbol('VesPluginFactory');
export type VesPluginFactory = (options: VesPluginOptions) => VesPlugin;

@injectable()
export class VesPlugin implements VesPluginData, TreeElement {

    @inject(VesPluginOptions)
    protected readonly options: VesPluginOptions;

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(HostedPluginSupport)
    protected readonly pluginSupport: HostedPluginSupport;

    @inject(PluginServer)
    protected readonly pluginServer: PluginServer;

    @inject(ProgressService)
    protected readonly progressService: ProgressService;

    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;

    @inject(VesPluginsSearchModel)
    readonly search: VesPluginsSearchModel;

    protected readonly data: Partial<VesPluginData> = {};

    get uri(): URI {
        return new URI(`vscode:extension/${this.id}`);
    }

    get id(): string {
        return this.options.id;
    }

    get visible(): boolean {
        return !!this.name;
    }

    get plugin(): DeployedPlugin | undefined {
        return this.pluginSupport.getPlugin(this.id);
    }

    get installed(): boolean {
        return !!this.plugin;
    }

    update(data: Partial<VesPluginData>): void {
        for (const key of VesPluginData.KEYS) {
            if (key in data) {
                Object.assign(this.data, { [key]: data[key] });
            }
        }
    }

    protected getData<K extends keyof VesPluginData>(key: K): VesPluginData[K] {
        const plugin = this.plugin;
        const model = plugin && plugin.metadata.model;
        if (model && key in model) {
            return model[key as keyof typeof model] as VesPluginData[K];
        }
        return this.data[key];
    }

    get iconUrl(): string | undefined {
        const plugin = this.plugin;
        const iconUrl = plugin && plugin.metadata.model.iconUrl;
        if (iconUrl) {
            return new Endpoint({ path: iconUrl }).getRestUrl().toString();
        }
        return this.data['iconUrl'];
    }

    get publisher(): string | undefined {
        return this.getData('publisher');
    }

    get name(): string | undefined {
        return this.getData('name');
    }

    get displayName(): string | undefined {
        return this.getData('displayName') || this.name;
    }

    get description(): string | undefined {
        return this.getData('description');
    }

    get version(): string | undefined {
        return this.getData('version');
    }

    get averageRating(): number | undefined {
        return this.getData('averageRating');
    }

    get downloadCount(): number | undefined {
        return this.getData('downloadCount');
    }

    get downloadUrl(): string | undefined {
        return this.getData('downloadUrl');
    }

    get readmeUrl(): string | undefined {
        const plugin = this.plugin;
        const readmeUrl = plugin && plugin.metadata.model.readmeUrl;
        if (readmeUrl) {
            return new Endpoint({ path: readmeUrl }).getRestUrl().toString();
        }
        return this.data['readmeUrl'];
    }

    get licenseUrl(): string | undefined {
        let licenseUrl = this.data['licenseUrl'];
        if (licenseUrl) {
            return licenseUrl;
        } else {
            const plugin = this.plugin;
            licenseUrl = plugin && plugin.metadata.model.licenseUrl;
            if (licenseUrl) {
                return new Endpoint({ path: licenseUrl }).getRestUrl().toString();
            }
        }
    }

    get repository(): string | undefined {
        return this.getData('repository');
    }

    get license(): string | undefined {
        return this.getData('license');
    }

    get readme(): string | undefined {
        return this.getData('readme');
    }

    get preview(): boolean | undefined {
        return this.getData('preview');
    }

    get publishedBy(): string | undefined {
        return this.getData('publishedBy');
    }

    protected _busy = 0;
    get busy(): boolean {
        return !!this._busy;
    }

    async install(): Promise<void> {
        this._busy++;
        try {
            await this.progressService.withProgress(`"Installing '${this.id}' Plugin...`, 'Plugins', () =>
                this.pluginServer.deploy(this.uri.toString())
            );
        } finally {
            this._busy--;
        }
    }

    async uninstall(): Promise<void> {
        this._busy++;
        try {
            await this.progressService.withProgress(`Uninstalling '${this.id}' Plugin...`, 'Plugins', () =>
                this.pluginServer.undeploy(this.id)
            );
        } finally {
            this._busy--;
        }
    }

    handleContextMenu(e: React.MouseEvent<HTMLElement, MouseEvent>): void {
        e.preventDefault();
        this.contextMenuRenderer.render({
            menuPath: PLUGINS_CONTEXT_MENU,
            anchor: {
                x: e.clientX,
                y: e.clientY,
            },
            args: [this]
        });
    }

    /**
     * Get the registry link for the given plugin.
     * @param path the url path.
     * @returns the registry link for the given plugin at the path.
     */
    async getRegistryLink(path = ''): Promise<URI> {
        const uri = new URI('http://www.virtual-boy.com');
        return uri.resolve('extension/' + this.id.replace('.', '/')).resolve(path);
    }

    async serialize(): Promise<string> {
        const serializedPlugin: string[] = [];
        serializedPlugin.push(`Name: ${this.displayName}`);
        serializedPlugin.push(`Id: ${this.id}`);
        serializedPlugin.push(`Description: ${this.description}`);
        serializedPlugin.push(`Version: ${this.version}`);
        serializedPlugin.push(`Publisher: ${this.publisher}`);
        if (this.downloadUrl !== undefined) {
            const registryLink = await this.getRegistryLink();
            serializedPlugin.push(`Open VSX Link: ${registryLink.toString()}`);
        };
        return serializedPlugin.join('\n');
    }

    async open(options: OpenerOptions = { mode: 'reveal' }): Promise<void> {
        await this.doOpen(this.uri, options);
    }

    async doOpen(uri: URI, options?: OpenerOptions): Promise<void> {
        await open(this.openerService, uri, options);
    }

    render(): React.ReactNode {
        return <VesPluginComponent plugin={this} />;
    }
}

export abstract class AbstractVesPluginComponent extends React.Component<AbstractVesPluginComponent.Props> {

    readonly install = async () => {
        this.forceUpdate();
        try {
            const pending = this.props.plugin.install();
            this.forceUpdate();
            await pending;
        } finally {
            this.forceUpdate();
        }
    };

    readonly uninstall = async () => {
        try {
            const pending = this.props.plugin.uninstall();
            this.forceUpdate();
            await pending;
        } finally {
            this.forceUpdate();
        }
    };

    protected readonly manage = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        this.props.plugin.handleContextMenu(e);
    };

    protected renderAction(): React.ReactNode {
        const plugin = this.props.plugin;
        const { busy, installed } = plugin;
        if (busy) {
            if (installed) {
                return <button className="theia-button action theia-mod-disabled" > Uninstalling </button>;
            }
            return <button className="theia-button action prominent theia-mod-disabled" > Installing </button>;
        }
        if (installed) {
            return <div><button className="theia-button action" onClick={this.uninstall} > Uninstall </button>
                < div className="codicon codicon-settings-gear action" onClick={this.manage} > </div></div>;
        }
        return <button className="theia-button prominent action" onClick={this.install} > Install </button>;
    }

}
export namespace AbstractVesPluginComponent {
    export interface Props {
        plugin: VesPlugin;
    }
}

const downloadFormatter = new Intl.NumberFormat();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const downloadCompactFormatter = new Intl.NumberFormat(undefined, { notation: 'compact', compactDisplay: 'short' } as any);

export class VesPluginComponent extends AbstractVesPluginComponent {
    render(): React.ReactNode {
        const { iconUrl, publisher, displayName, description, version, downloadCount, averageRating } = this.props.plugin;
        return <div className='theia-vsx-extension'>
            {
                iconUrl ?
                    <img className='theia-vsx-extension-icon' src={iconUrl} /> :
                    <div className='theia-vsx-extension-icon placeholder' />}
            <div className='theia-vsx-extension-content'>
                <div className='title'>
                    <div className='noWrapInfo'>
                        <span className='name'> {displayName} </span> <span className='version'>{version}</span >
                    </div>
                    < div className='stat'>
                        {!!downloadCount && <span className='download-count'> <i className='fa fa-download' /> {downloadCompactFormatter.format(downloadCount)} </span>}
                        {
                            !!averageRating && <span className='average-rating'> <i className='fa fa-star' /> {averageRating.toFixed(1)} </span>}
                    </div>
                </div>
                < div className='noWrapInfo theia-vsx-extension-description'> {description} </div>
                < div className='theia-vsx-extension-action-bar'>
                    <span className='noWrapInfo theia-vsx-extension-publisher'> {publisher} </span>
                    {this.renderAction()}
                </div>
            </div>
        </div>;
    }
}

export class VesPluginEditorComponent extends AbstractVesPluginComponent {
    protected header: HTMLElement | undefined;
    protected body: HTMLElement | undefined;
    protected _scrollContainer: HTMLElement | undefined;

    get scrollContainer(): HTMLElement | undefined {
        return this._scrollContainer;
    }

    render(): React.ReactNode {
        const {
            preview, id, iconUrl, publisher, displayName, description, version,
            averageRating, downloadCount, repository, license, readme
        } = this.props.plugin;

        const { baseStyle, scrollStyle } = this.getSubcomponentStyles();
        const sanitizedReadme = !!readme ? DOMPurify.sanitize(readme) : undefined;

        return <React.Fragment>
            <div className='header' style={baseStyle} ref={ref => this.header = (ref || undefined)} >
                {
                    iconUrl ?
                        <img className='icon-container' src={iconUrl} /> :
                        <div className='icon-container placeholder' />}
                <div className='details'>
                    <div className='title'>
                        <span title='Plugin name' className='name' onClick={this.openPlugin} > {displayName} </span>
                        < span title='Plugin identifier' className='identifier'> {id} </span>
                        {preview && <span className='preview'> Preview </span>}
                    </div>
                    < div className='subtitle'>
                        <span title='Publisher name' className='publisher' onClick={this.searchPublisher} >
                            {publisher}
                        </span>
                        {
                            !!downloadCount && <span className='download-count' onClick={this.openPlugin} >
                                <i className="fa fa-download" /> {downloadFormatter.format(downloadCount)} </span>}
                        {
                            averageRating !== undefined && <span className='average-rating' onClick={this.openAverageRating} > {this.renderStars()} </span>}
                        {
                            repository && <span className='repository' onClick={this.openRepository} > Repository </span>}
                        {
                            license && <span className='license' onClick={this.openLicense} > {license} </span>}
                        {
                            version && <span className='version'> {version} </span>}
                    </div>
                    < div className='description noWrapInfo'> {description} </div>
                    {this.renderAction()}
                </div>
            </div>
            {
                sanitizedReadme &&
                <div className='scroll-container'
                    style={scrollStyle}
                    ref={ref => this._scrollContainer = (ref || undefined)} >
                    <div className='body'
                        ref={ref => this.body = (ref || undefined)}
                        onClick={this.openLink}
                        style={baseStyle}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: sanitizedReadme }
                        }
                    />
                </div>
            }
        </React.Fragment >;
    }

    protected renderStars(): React.ReactNode {
        const rating = this.props.plugin.averageRating || 0;

        const renderStarAt = (position: number) => position <= rating ?
            <i className='fa fa-star' /> :
            position > rating && position - rating < 1 ?
                <i className='fa fa-star-half-o' /> :
                <i className='fa fa-star-o' />;
        return <React.Fragment>
            {renderStarAt(1)}{renderStarAt(2)} {renderStarAt(3)} {renderStarAt(4)} {renderStarAt(5)}
        </React.Fragment>;
    }

    protected getSubcomponentStyles(): { baseStyle: React.CSSProperties, scrollStyle: React.CSSProperties; } {
        const visibility: 'unset' | 'hidden' = this.header ? 'unset' : 'hidden';
        const baseStyle = { visibility };
        const scrollStyle = this.header?.clientHeight ? { visibility, height: `calc(100% - (${this.header.clientHeight}px + 1px))` } : baseStyle;

        return { baseStyle, scrollStyle };
    }

    // TODO replace with webview
    readonly openLink = (event: React.MouseEvent) => {
        if (!this.body) {
            return;
        }
        const target = event.nativeEvent.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        let node = target;
        while (node.tagName.toLowerCase() !== 'a') {
            if (node === this.body) {
                return;
            }
            if (!(node.parentElement instanceof HTMLElement)) {
                return;
            }
            node = node.parentElement;
        }
        const href = node.getAttribute('href');
        if (href && !href.startsWith('#')) {
            event.preventDefault();
            this.props.plugin.doOpen(new URI(href));
        }
    };

    readonly openPlugin = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        const uri = await plugin.getRegistryLink();
        plugin.doOpen(uri);
    };
    readonly searchPublisher = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        if (plugin.publisher) {
            plugin.search.query = plugin.publisher;
        }
    };
    readonly openPublishedBy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        const homepage = plugin.publishedBy && plugin.publishedBy;
        if (homepage) {
            plugin.doOpen(new URI(homepage));
        }
    };
    readonly openAverageRating = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        const uri = await plugin.getRegistryLink('reviews');
        plugin.doOpen(uri);
    };
    readonly openRepository = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        if (plugin.repository) {
            plugin.doOpen(new URI(plugin.repository));
        }
    };
    readonly openLicense = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        const licenseUrl = plugin.licenseUrl;
        if (licenseUrl) {
            plugin.doOpen(new URI(licenseUrl));
        }
    };
}
