import * as React from "react";
import * as path from "path";
import * as filenamify from "filenamify";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { FileDialogService, OpenFileDialogProps } from "@theia/filesystem/lib/browser";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesProjectsBaseFolderPreference } from "./preferences";
import URI from "@theia/core/lib/common/uri";

export interface VesNewProjectFormProps {
    fileService: FileService
    fileDialogService: FileDialogService
    preferenceService: PreferenceService
}

export interface VesNewProjectFormData {
    name: string
    template: string
    path: string
}

export class VesNewProjectForm extends React.Component<VesNewProjectFormProps, VesNewProjectFormData> {
    protected fileService: FileService
    protected fileDialogService: FileDialogService
    protected preferenceService: PreferenceService

    constructor(props: VesNewProjectFormProps) {
        super(props);

        this.fileService = props.fileService
        this.fileDialogService = props.fileDialogService
        this.preferenceService = props.preferenceService

        this.state = {
            name: "",
            template: "vuengine-barebone",
            path: this.preferenceService.get(VesProjectsBaseFolderPreference.id) as string,
        }
    }

    render(): JSX.Element {
        return <>
            <div style={{ width: 600 }} />
            <div className="ves-new-project-input-label">Name</div>
            <input
                type="text"
                className="theia-input"
                value={this.state.name}
                onChange={this.updateName}
            />
            <br />
            <div className="ves-new-project-input-label">Template</div>
            <select
                className="theia-select"
                value={this.state.template}
                onChange={this.updateTemplate}
            >
                <option value="vuengine-barebone">Barebone</option>
            </select>
            <br />
            <div className="ves-new-project-input-label">Path</div>
            <div style={{ display: "flex" }}>
                <input
                    type="text"
                    className="theia-input"
                    value={this.state.path}
                    onChange={this.updatePath}
                    // size={this.state.path.length}
                    style={{ flexGrow: 3 }}
                />
                <span className="ves-new-project-path-separator">
                    {path.sep}
                </span>
                <input
                    type="text"
                    className="theia-input"
                    value={this.projectFolderName()}
                    onChange={this.updatePath}
                    // size={this.projectFolderName().length}
                    style={{ flexGrow: 1 }}
                />
                <button
                    className="theia-button secondary"
                    onClick={() => this.selectProjectFolder()}
                    style={{ minWidth: 40 }}
                >
                    <i
                        style={{ fontSize: 16, verticalAlign: "bottom" }}
                        className="fa fa-ellipsis-h"
                    />
                </button>
            </div>
            <br />
            {/* <input type="checkbox" className="theia-input" style={{ display: "inline-block" }} checked /> Open project after creation */}
            {/* <input type="checkbox" className="theia-input" style={{ display: "inline-block" }} /> Init Git repository */}
            <br />
        </>;
    }

    protected updateName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        name: e.currentTarget.value
    });

    protected updateTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => this.setState({
        template: e.currentTarget.value
    });

    protected updatePath = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        path: e.currentTarget.value
    });

    protected projectFolderName(): string {
        return filenamify(this.state.name, { replacement: " " })
            .replace(/\s+/g, '-')
            .toLowerCase()
    }

    protected async selectProjectFolder() {
        const props: OpenFileDialogProps = {
            title: "Select new project's parent folder",
            canSelectFolders: true,
            canSelectFiles: false
        };
        const currentPath = await this.fileService.resolve(new URI(this.state.path));
        const destinationFolderUri = await this.fileDialogService.showOpenDialog(props, currentPath);
        if (destinationFolderUri) {
            const destinationFolder = await this.fileService.resolve(destinationFolderUri);
            if (destinationFolder.isDirectory) {
                this.setState({
                    path: destinationFolder.resource.path.toString()
                });
            }
        }
    }
}