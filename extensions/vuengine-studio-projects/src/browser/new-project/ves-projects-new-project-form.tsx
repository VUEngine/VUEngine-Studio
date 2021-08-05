import { sep } from 'path';
import * as filenamify from 'filenamify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';

import { VesProjectsPreferenceIds } from '../ves-projects-preferences';

export interface VesNewProjectFormComponentProps {
    fileService: FileService
    fileDialogService: FileDialogService
    preferenceService: PreferenceService
}

export interface VesNewProjectFormComponentState {
    name: string
    template: number
    path: string
    folder: string,
    isCreating: boolean
}

export interface VesNewProjectTemplate {
    name: string
    id: string
    description: string
}

export const VES_NEW_PROJECT_TEMPLATES: VesNewProjectTemplate[] = [{
    name: 'Barebone',
    id: 'vuengine-barebone',
    description: 'An (almost) empty project that includes a single "Hello World" screen plus the most important plugins to add splash screens, automatic pause and more.',
}, {
    name: 'Platform Game',
    id: 'vuengine-platformer-demo',
    description: 'A full featured single level platforming game.',
}, {
    name: 'Multiplayer Game',
    id: 'spong',
    description: 'A simple Pong-like game that utilizes the engine\'s communication class for multiplayer matches over a link cable.',
}, {
    name: 'Image Viewer',
    id: 'vue-master',
    description: 'Stereo image viewer.',
}];

export class VesNewProjectFormComponent extends React.Component<VesNewProjectFormComponentProps, VesNewProjectFormComponentState> {
    protected fileService: FileService;
    protected fileDialogService: FileDialogService;
    protected preferenceService: PreferenceService;

    constructor(props: VesNewProjectFormComponentProps) {
        super(props);

        this.fileService = props.fileService;
        this.fileDialogService = props.fileDialogService;
        this.preferenceService = props.preferenceService;

        this.state = {
            name: '',
            template: 0,
            path: this.removeTrailingSlash(this.preferenceService.get(VesProjectsPreferenceIds.BASE_FOLDER) as string),
            folder: 'new-project',
            isCreating: false
        };

        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesProjectsPreferenceIds.BASE_FOLDER) {
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
            <div className="ves-new-project-input-label">Path</div>
            <div style={{ display: 'flex' }}>
                <input
                    type="text"
                    className="theia-input"
                    value={this.state.path}
                    onChange={this.updatePathFolder}
                    size={this.state.path.length}
                    style={{ fontFamily: 'monospace', maxWidth: 332 }}
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
                    style={{ flexGrow: 1, fontFamily: 'monospace' }}
                    disabled={this.state.isCreating}
                />
                <button
                    className="theia-button secondary"
                    onClick={() => this.selectProjectFolder()}
                    style={{ minWidth: 40 }}
                    disabled={this.state.isCreating}
                >
                    <i
                        style={{ fontSize: 16, verticalAlign: 'bottom' }}
                        className="fa fa-ellipsis-h"
                    />
                </button>
            </div>
            <br />
            <div className="ves-new-project-input-label">Template</div>
            <div className="ves-new-project-templates-container">
                {VES_NEW_PROJECT_TEMPLATES.map((template, index) => {
                    const selected = index === this.state.template ? ' selected' : '';
                    return <div
                        data-template={VES_NEW_PROJECT_TEMPLATES[this.state.template].id}
                        className={`ves-new-project-template ves-new-project-template-${template.id}${selected}`}
                        onClick={() => this.updateTemplate(index)}
                    ></div>;
                })}
            </div>
            <div className="ves-new-project-template-name">
                {VES_NEW_PROJECT_TEMPLATES[this.state.template].name}
            </div>
            <div className="ves-new-project-template-description">
                {VES_NEW_PROJECT_TEMPLATES[this.state.template].description}
            </div>
        </>;
    }

    protected updateName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        name: e.currentTarget.value,
        folder: this.getPathName(e.currentTarget.value),
    });

    protected updateTemplate = (index: number) => this.setState({
        template: index
    });

    protected updatePathFolder = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        path: e.currentTarget.value
    });

    protected updatePathName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        folder: e.currentTarget.value
    });

    protected getPathName(name: string): string {
        return filenamify(name, { replacement: ' ' })
            .replace(/\s+/g, '-')
            .toLowerCase();
    }

    protected async selectProjectFolder(): Promise<void> {
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

    removeTrailingSlash(string: string): string {
        return string.replace(/\/$/, '');
    }
}
