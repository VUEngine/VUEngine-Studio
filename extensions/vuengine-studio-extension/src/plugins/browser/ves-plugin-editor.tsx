import { CommandService, nls, PreferenceService } from '@theia/core';
import { HoverService, Message, ReactWidget, Widget } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import VesPluginEditorComponent from './components/VesPluginEditorComponent';
import { VesPlugin } from './ves-plugin';
import { VesPluginsModel } from './ves-plugins-model';
import { VesPluginsPathsService } from './ves-plugins-paths-service';

@injectable()
export class VesPluginEditor extends ReactWidget {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(HoverService)
    protected readonly hoverService: HoverService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesPlugin)
    protected readonly plugin: VesPlugin;
    @inject(VesPluginsModel)
    protected readonly model: VesPluginsModel;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesPluginsPathsService)
    readonly vesPluginsPathsService: VesPluginsPathsService;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

    static ID = 'ves-plugin-editor';
    protected readonly deferredScrollContainer = new Deferred<HTMLElement>();

    @postConstruct()
    protected init(): void {
        this.addClass('theia-vsx-extension-editor');
        this.addClass('ves-plugin-editor');
        this.id = `${VesPluginEditor.ID}:${this.plugin.id}`;
        this.title.closable = true;
        this.updateTitle();
        this.title.iconClass = 'codicon codicon-plug';
        this.node.tabIndex = -1;
        this.update();
        this.toDispose.push(this.model.onDidChangeData(() => this.update()));
    }

    getScrollContainer(): Promise<HTMLElement> {
        return this.deferredScrollContainer.promise;
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.updateTitle();
    }

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.update();
    }

    protected updateTitle(): void {
        const prefix = nls.localize('vuengine/plugins/plugin', 'Plugin');
        const pluginName = this.plugin.displayName || this.plugin.name;
        const label = `${prefix}: ${pluginName}`;
        this.title.label = label;
        this.title.caption = label;
    }

    protected onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.update();
    };

    protected resolveScrollContainer = (element: VesPluginEditorComponent | null) => {
        if (!element) {
            this.deferredScrollContainer.reject(new Error('element is null'));
        } else if (!element.scrollContainer) {
            this.deferredScrollContainer.reject(new Error('element.scrollContainer is undefined'));
        } else {
            this.deferredScrollContainer.resolve(element.scrollContainer);
        }
    };

    protected render(): React.ReactNode {
        return <VesPluginEditorComponent
            ref={this.resolveScrollContainer}
            plugin={this.plugin}
            commandService={this.commandService}
            fileService={this.fileService}
            hoverService={this.hoverService}
            preferenceService={this.preferenceService}
            workspaceService={this.workspaceService}
            vesCommonService={this.vesCommonService}
            vesProjectService={this.vesProjectService}
            vesPluginsPathsService={this.vesPluginsPathsService}
        />;
    }
}
