import { CommandService } from '@theia/core';
import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { open, OpenerOptions, OpenerService } from '@theia/core/lib/browser/opener-service';
import { TreeElement } from '@theia/core/lib/browser/source-tree';
import { MenuPath } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import * as DOMPurify from '@theia/core/shared/dompurify';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesPluginUri } from '../common/ves-plugin-uri';
import { VesPluginsCommands } from './ves-plugins-commands';
import { VesPluginsSearchModel } from './ves-plugins-search-model';
import { VesPluginsService } from './ves-plugins-service';

export const PLUGINS_CONTEXT_MENU: MenuPath = ['plugins_context_menu'];

export namespace VesPluginsContextMenu {
    export const COPY = [...PLUGINS_CONTEXT_MENU, '1_copy'];
}

export interface VesPluginsData {
    [id: string]: VesPluginData
}

@injectable()
export class VesPluginData {
    readonly name?: string;
    readonly displayName?: string;
    readonly author?: string;
    readonly description?: string;
    readonly icon?: string;
    readonly readme?: string;
    readonly repository?: string;
    readonly license?: string;
    readonly tags?: string[];
    readonly dependencies?: string[];
    static KEYS: Set<(keyof VesPluginData)> = new Set([
        'name',
        'displayName',
        'author',
        'description',
        'icon',
        'readme',
        'repository',
        'license',
        'tags',
        'dependencies'
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

    @inject(OpenerService)
    protected readonly openerService: OpenerService;

    @inject(ContextMenuRenderer)
    protected readonly contextMenuRenderer: ContextMenuRenderer;

    @inject(VesPluginOptions)
    protected readonly options: VesPluginOptions;

    @inject(VesPluginsSearchModel)
    readonly search: VesPluginsSearchModel;

    @inject(VesPluginsService)
    readonly pluginsService: VesPluginsService;

    @inject(WorkspaceService)
    readonly workspaceService: WorkspaceService;

    protected readonly data: Partial<VesPluginData> = {};

    get uri(): URI {
        return VesPluginUri.toUri(this.id);
    }

    get id(): string {
        return this.options.id;
    }

    get visible(): boolean {
        return !!this.name;
    }

    get plugin(): VesPluginData | undefined {
        return this.pluginsService.getPluginById(this.id);
    }

    get installed(): boolean {
        return this.pluginsService.isInstalled(this.id);
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
        if (plugin && key in plugin) {
            return plugin[key as keyof typeof plugin] as VesPluginData[K];
        }
        return this.data[key];
    }

    get icon(): string | undefined {
        return this.data['icon'];
        /* const plugin = this.plugin;
        const icon = plugin && plugin.icon;
        if (icon) {
            return new Endpoint({ path: icon }).getRestUrl().toString();
        }
        return this.data['icon']; */
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

    get readme(): string | undefined {
        return this.data['readme'];
    }

    get repository(): string | undefined {
        return this.getData('repository');
    }

    get license(): string | undefined {
        return this.getData('license');
    }

    get tags(): string[] | undefined {
        return this.getData('tags');
    }

    get dependencies(): string[] | undefined {
        return this.getData('dependencies');
    }

    get author(): string | undefined {
        return this.getData('author');
    }

    async install(): Promise<void> {
        await this.pluginsService.installPlugin(this.id);
    }

    async uninstall(): Promise<void> {
        await this.pluginsService.uninstallPlugin(this.id);
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

    async serialize(): Promise<string> {
        const serializedPlugin: string[] = [];
        serializedPlugin.push(`Id: ${this.id}`);
        serializedPlugin.push(`Name: ${this.displayName}`);
        serializedPlugin.push(`Author: ${this.author}`);
        serializedPlugin.push(`Description: ${this.description}`);
        return serializedPlugin.join('\n');
    }

    async open(options: OpenerOptions = { mode: 'reveal' }): Promise<void> {
        await this.doOpen(this.uri, options);
    }

    async doOpen(uri: URI, options?: OpenerOptions): Promise<void> {
        await open(this.openerService, uri, options);
    }

    render(): React.ReactNode {
        return <VesPluginComponent plugin={this} workspaceService={this.workspaceService} />;
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
        if (!this.props.workspaceService.opened) {
            return;
        }

        const plugin = this.props.plugin;
        const { installed } = plugin;
        if (installed) {
            return <button className="theia-button action" onClick={this.uninstall}>Remove</button>;
        }
        return <button className="theia-button prominent action" onClick={this.install}>Add</button>;
    }

}
export namespace AbstractVesPluginComponent {
    export interface Props {
        plugin: VesPlugin;
        commandService?: CommandService;
        workspaceService: WorkspaceService
    }
}

export class VesPluginComponent extends AbstractVesPluginComponent {
    render(): React.ReactNode {
        const { icon, displayName, description, tags } = this.props.plugin;
        return <div className='theia-vsx-extension ves-plugin'>
            {icon
                ? <img className='theia-vsx-extension-icon' src={icon} />
                : <div className='theia-vsx-extension-icon ves-placeholder'><i className="codicon codicon-plug" /></div>}
            <div className='theia-vsx-extension-content'>
                <div className='title'>
                    <div className='noWrapInfo'>
                        <span className='name'>{displayName}</span> <span className='version'></span>
                    </div>
                    <div className='stat'>
                    </div>
                </div>
                <div className='noWrapInfo theia-vsx-extension-description'>{description}</div>
                <div className='theia-vsx-extension-action-bar'>
                    <span className='noWrapInfo ves-plugin-tags'>
                        {tags && tags.map((tag: string, i: number) => <span key={i}>{tag}</span>)}
                    </span>
                    {/* <span className='noWrapInfo theia-vsx-extension-publisher'>{author}</span> */}
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
        const { id, icon, author, displayName, description, repository, license, tags, readme, dependencies } = this.props.plugin;

        const { baseStyle, scrollStyle } = this.getSubcomponentStyles();
        const sanitizedReadme = !!readme ? DOMPurify.sanitize(readme) : undefined;
        const dependenciesList = this.renderDependenciesList(dependencies || []);

        return <>
            <div className='header' style={baseStyle} ref={ref => this.header = (ref || undefined)}>
                {icon ?
                    <img className='icon-container' src={icon} /> :
                    <div className='icon-container ves-placeholder'><i className="codicon codicon-plug" /></div>}
                <div className='details'>
                    <div className='title'>
                        <span title='Plugin name' className='name'>{displayName}</span>
                        <span title='Plugin identifier' className='identifier'>{id}</span>
                    </div>
                    <div className='subtitle'>
                        <span title='Author' className='publisher' onClick={this.searchAuthor}>
                            {author}
                        </span>
                        {repository && <span className='repository' onClick={this.openRepository}>Repository</span>}
                        {license && <span className='license'>{license}</span>}
                        {tags && <span className='noWrapInfo ves-plugin-tags'>{
                            tags.map((tag: string, i: number) => <span onClick={() => this.searchTag(tag)} key={i}>{tag}</span>)
                        }</span>}
                    </div>
                    <div className='description noWrapInfo'> {description} </div>
                    {this.renderAction()}
                </div>
            </div>
            {
                sanitizedReadme &&
                <div className='scroll-container'
                    style={scrollStyle}
                    ref={ref => this._scrollContainer = (ref || undefined)}>
                    <div className='body'
                        ref={ref => this.body = (ref || undefined)}
                        onClick={this.openLink}
                        style={baseStyle}
                        // eslint-disable-next-line react/no-danger
                        dangerouslySetInnerHTML={{ __html: sanitizedReadme + dependenciesList }}
                    />
                </div>
            }
        </>;
    }

    protected renderDependenciesList(dependencies: string[]): string {
        let dependenciesList = "<h3>Dependencies</h3>";

        if (dependencies?.length) {
            dependenciesList += "<ul>";
            for (const dependency of dependencies) {
                dependenciesList += `<li><code>${dependency}</code></li>`;
            }
            dependenciesList += "</ul>";
        } else {
            dependenciesList += "<li><i>None</i></li>";
        }

        return dependenciesList;
    }

    protected getSubcomponentStyles(): { baseStyle: React.CSSProperties, scrollStyle: React.CSSProperties; } {
        const visibility: 'unset' | 'hidden' = this.header ? 'unset' : 'hidden';
        const baseStyle = { visibility };
        const scrollStyle = this.header?.clientHeight ? { visibility, height: `calc(100% - (${this.header.clientHeight}px + 1px))` } : baseStyle;

        return { baseStyle, scrollStyle };
    }

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
            this.props.plugin.doOpen(new URI(href).withScheme('file'));
        }
    };

    readonly searchTag = async (tag: string) => this.props.commandService?.executeCommand(VesPluginsCommands.SEARCH_BY_TAG.id, tag);

    readonly searchAuthor = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        if (plugin.author) {
            this.props.commandService?.executeCommand(VesPluginsCommands.SEARCH_BY_AUTHOR.id, plugin.author);
        }
    };

    readonly openRepository = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        if (plugin.repository) {
            plugin.doOpen(new URI(plugin.repository).withScheme('file'));
        }
    };
}
