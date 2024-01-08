import { CommandService, nls } from "@theia/core";
import React from "react";
import { VesPlugin } from "../ves-plugin";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";

export interface AbstractVesPluginComponentProps {
    plugin: VesPlugin
    commandService?: CommandService
    fileService?: FileService
    workspaceService: WorkspaceService
}

export interface AbstractVesPluginComponentState {
    renderedReadme?: string
    tab?: number
}

export default abstract class AbstractVesPluginComponent extends React.Component<AbstractVesPluginComponentProps, AbstractVesPluginComponentState> {
    readonly install = async (event?: React.MouseEvent) => {
        event?.stopPropagation();
        await this.props.plugin.install();
        this.forceUpdate();
    };

    readonly uninstall = async (event?: React.MouseEvent) => {
        event?.stopPropagation();
        await this.props.plugin.uninstall();
        this.forceUpdate();
    };

    protected readonly manage = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        e.stopPropagation();
        this.props.plugin.handleContextMenu(e);
    };

    protected renderAction(): React.ReactNode {
        if (!this.props.workspaceService.opened) {
            return;
        }

        const plugin = this.props.plugin;
        const { installed } = plugin;
        if (installed) {
            return <button className="theia-button action" onClick={this.uninstall}>
                {nls.localize('vuengine/plugins/remove', 'Remove')}
            </button>;
        }
        return <button className="theia-button prominent action" onClick={this.install}>
            {nls.localize('vuengine/plugins/add', 'Add')}
        </button>;
    }

}
