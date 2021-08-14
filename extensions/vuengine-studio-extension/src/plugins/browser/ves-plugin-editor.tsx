import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ReactWidget, Message, Widget } from '@theia/core/lib/browser';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { VesPlugin, VesPluginEditorComponent } from './ves-plugin';
import { VesPluginsModel } from './ves-plugins-model';

@injectable()
export class VesPluginEditor extends ReactWidget {

    static ID = 'ves-plugin-editor';

    @inject(VesPlugin)
    protected readonly plugin: VesPlugin;

    @inject(VesPluginsModel)
    protected readonly model: VesPluginsModel;

    protected readonly deferredScrollContainer = new Deferred<HTMLElement>();

    @postConstruct()
    protected init(): void {
        this.addClass('theia-vsx-extension-editor');
        this.id = `${VesPluginEditor.ID}:${this.plugin.id}`;
        this.title.closable = true;
        this.updateTitle();
        this.title.iconClass = 'fa fa-plug';
        this.node.tabIndex = -1;
        this.update();
        this.toDispose.push(this.model.onDidChange(() => this.update()));
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
        this.deferredScrollContainer.resolve(element?.scrollContainer);
    };

    protected render(): React.ReactNode {
        return <VesPluginEditorComponent
            ref={this.resolveScrollContainer}
            plugin={this.plugin}
        />;
    }
}
