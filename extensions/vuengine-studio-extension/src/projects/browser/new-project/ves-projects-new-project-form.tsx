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
    author: string
    makerCode: string
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

    protected nameInputComponentRef: React.RefObject<HTMLInputElement> = React.createRef();

    constructor(props: VesNewProjectFormComponentProps) {
        super(props);

        this.fileService = props.fileService;
        this.fileDialogService = props.fileDialogService;
        this.preferenceService = props.preferenceService;

        this.state = {
            name: 'My Project',
            template: 0,
            author: '',
            makerCode: '',
            path: '',
            folder: 'my-project',
            isCreating: false
        };

        this.preferenceService.ready.then(() => this.setStateFromPreferences());

        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            switch (preferenceName) {
                case VesProjectsPreferenceIds.BASE_FOLDER:
                case VesProjectsPreferenceIds.AUTHOR:
                case VesProjectsPreferenceIds.MAKER_CODE:
                    this.setStateFromPreferences();
                    break;
            }
        });
    }

    protected setStateFromPreferences(): void {
        this.setState({
            author: this.preferenceService.get(VesProjectsPreferenceIds.AUTHOR) as string,
            makerCode: this.preferenceService.get(VesProjectsPreferenceIds.MAKER_CODE) as string,
            path: this.removeTrailingSlash(this.preferenceService.get(VesProjectsPreferenceIds.BASE_FOLDER) as string),
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
                tabIndex={1}
                ref={this.nameInputComponentRef}
            />
            <br />
            <div style={{ display: 'flex' }}>
                <div style={{ flexGrow: 1, paddingRight: 8 }}>
                    <div className="ves-new-project-input-label">Author</div>
                    <input
                        type="text"
                        className="theia-input"
                        value={this.state.author}
                        onChange={this.updateAuthor}
                        disabled={this.state.isCreating}
                        style={{ boxSizing: 'border-box', width: '100%' }}
                        tabIndex={2}
                    />
                </div>
                <div>
                    <div className="ves-new-project-input-label">Maker Code</div>
                    <input
                        type="text"
                        className="theia-input"
                        value={this.state.makerCode}
                        onChange={this.updateMakerCode}
                        disabled={this.state.isCreating}
                        size={4}
                        maxLength={2}
                        minLength={2}
                        tabIndex={3}
                    />
                </div>
            </div>
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
                    tabIndex={4}
                />
                <button
                    className="theia-button secondary"
                    onClick={() => this.selectProjectFolder()}
                    style={{ marginLeft: 0, minWidth: 40, paddingBottom: 0 }}
                    disabled={this.state.isCreating}
                    tabIndex={5}
                >
                    <i
                        style={{ fontSize: 16, verticalAlign: 'bottom' }}
                        className="fa fa-ellipsis-h"
                    />
                </button>
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
                    tabIndex={6}
                />
            </div>
            <br />
            <div className="ves-new-project-input-label">Template</div>
            <div className="ves-new-project-templates-container">
                {VES_NEW_PROJECT_TEMPLATES.map((template, index) => {
                    const selected = index === this.state.template ? ' selected' : '';
                    return <div
                        key={`ves-new-project-template-${index}`}
                        data-template={VES_NEW_PROJECT_TEMPLATES[this.state.template].id}
                        className={`ves-new-project-template ves-new-project-template-${template.id}${selected}`}
                        onClick={() => this.updateTemplate(index)}
                        onFocus={() => this.updateTemplate(index)}
                        tabIndex={7 + index}
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

    protected updateAuthor = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        author: e.currentTarget.value,
    });

    protected updateMakerCode = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        makerCode: e.currentTarget.value,
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

    protected removeTrailingSlash(string: string): string {
        return string.replace(/\/$/, '');
    }

    focusNameInput(): void {
        this.nameInputComponentRef.current?.select();
    }
}
