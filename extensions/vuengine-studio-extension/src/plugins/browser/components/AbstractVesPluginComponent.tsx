import { CommandService, nls } from "@theia/core";
import { HoverService } from "@theia/core/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import React from "react";
import { VesCommonService } from "../../../core/browser/ves-common-service";
import { VesProjectService } from "../../../project/browser/ves-project-service";
import { VesPlugin } from "../ves-plugin";

export interface AbstractVesPluginComponentProps {
    plugin: VesPlugin
    commandService?: CommandService
    fileService?: FileService
    hoverService?: HoverService
    workspaceService: WorkspaceService
    vesCommonService?: VesCommonService
    vesProjectService?: VesProjectService
}

export interface AbstractVesPluginComponentState {
    renderedReadme?: string
    tab?: string
    ready?: boolean
    configuration: { [key: string]: any }
    dirtyConfigurations: { [key: string]: boolean }
    isSaving?: boolean
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
