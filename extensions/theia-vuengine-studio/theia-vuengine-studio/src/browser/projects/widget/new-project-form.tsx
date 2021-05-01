import * as React from "react";
import { sep } from "path";
import * as filenamify from "filenamify";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { FileDialogService, OpenFileDialogProps } from "@theia/filesystem/lib/browser";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesProjectsPrefs } from "../projects-preferences";
import URI from "@theia/core/lib/common/uri";

export interface VesNewProjectFormProps {
    fileService: FileService
    fileDialogService: FileDialogService
    preferenceService: PreferenceService
}

export interface VesNewProjectFormState {
    name: string
    template: string
    path: string
    folder: string,
    isCreating: boolean
}

export class VesNewProjectForm extends React.Component<VesNewProjectFormProps, VesNewProjectFormState> {
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
            path: this.removeTrailingSlash(this.preferenceService.get(VesProjectsPrefs.BASE_FOLDER.id) as string),
            folder: "new-project",
            isCreating: false
        }

        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesProjectsPrefs.BASE_FOLDER.id) {
                this.setState({ path: this.removeTrailingSlash(newValue) });
            }
        });
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
                disabled={this.state.isCreating}
            />
            <br />
            <div className="ves-new-project-input-label">Template</div>
            <select
                className="theia-select"
                value={this.state.template}
                onChange={this.updateTemplate}
                disabled={this.state.isCreating}
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
                    onChange={this.updatePathFolder}
                    size={this.state.path.length}
                    style={{ fontFamily: "monospace", maxWidth: 332 }}
                    disabled={this.state.isCreating}
                />
                <span className="ves-new-project-path-separator">
                    {sep}
                </span>
                <input
                    type="text"
                    className="theia-input"
                    value={this.state.folder}
                    onChange={this.updatePathName}
                    style={{ flexGrow: 1, fontFamily: "monospace" }}
                    disabled={this.state.isCreating}
                />
                <button
                    className="theia-button secondary"
                    onClick={() => this.selectProjectFolder()}
                    style={{ minWidth: 40 }}
                    disabled={this.state.isCreating}
                >
                    <i
                        style={{ fontSize: 16, verticalAlign: "bottom" }}
                        className="fa fa-ellipsis-h"
                    />
                </button>
            </div>
            <br />
            <br />
        </>;
    }

    protected updateName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        name: e.currentTarget.value,
        folder: this.getPathName(e.currentTarget.value),
    });

    protected updateTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => this.setState({
        template: e.currentTarget.value
    });

    protected updatePathFolder = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        path: e.currentTarget.value
    });

    protected updatePathName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        folder: e.currentTarget.value
    });

    protected getPathName(name: string): string {
        return filenamify(name, { replacement: " " })
            .replace(/\s+/g, '-')
            .toLowerCase()
    }

    protected async selectProjectFolder() {
        const props: OpenFileDialogProps = {
            title: "Select new project's parent folder",
            canSelectFolders: true,
            canSelectFiles: false
        };
        const currentPath = await this.fileService.exists(new URI(this.state.path))
            ? await this.fileService.resolve(new URI(this.state.path))
            : undefined;
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

    removeTrailingSlash(string: string) {
        return string.replace(/\/$/, "");
    }
}