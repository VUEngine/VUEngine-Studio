import { ContextMenuRenderer } from '@theia/core/lib/browser';
import { OpenerOptions, OpenerService, open } from '@theia/core/lib/browser/opener-service';
import { TreeElement } from '@theia/core/lib/browser/source-tree';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { MenuPath } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import VesPluginComponent from './components/VesPluginComponent';
import { VesPluginUri } from './ves-plugin-uri';
import { VesPluginsSearchModel } from './ves-plugins-search-model';
import { VesPluginsService } from './ves-plugins-service';
import { PluginConfiguration } from './ves-plugins-types';

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
    readonly configuration?: PluginConfiguration[];
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
        'dependencies',
        'configuration',
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
    @inject(WindowService)
    readonly windowService: WindowService;

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

    get author(): string | undefined {
        return this.getData('author');
    }

    get dependencies(): string[] | undefined {
        return this.getData('dependencies');
    }

    get configuration(): PluginConfiguration[] | undefined {
        return this.getData('configuration');
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
            args: [this],
            context: e.currentTarget,
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

    async openUrl(url: string): Promise<void> {
        await this.windowService.openNewWindow(url, { external: true });
    }

    render(): React.ReactNode {
        return <VesPluginComponent
            plugin={this}
            workspaceService={this.workspaceService}
        />;
    }
}
