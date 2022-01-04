import { CommandService } from '@theia/core';
import { Message, ReactWidget, Widget } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesPlugin, VesPluginEditorComponent } from './ves-plugin';
import { VesPluginsModel } from './ves-plugins-model';

@injectable()
export class VesPluginEditor extends ReactWidget {
    static ID = 'ves-plugin-editor';

    @inject(CommandService)
    protected readonly commandService: CommandService;

    @inject(VesPlugin)
    protected readonly plugin: VesPlugin;

    @inject(VesPluginsModel)
    protected readonly model: VesPluginsModel;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

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
        const label = `Plugin: ${(this.plugin.displayName || this.plugin.name)}`;
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
            workspaceService={this.workspaceService}
        />;
    }
}
