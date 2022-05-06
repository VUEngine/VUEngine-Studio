import { isWindows } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import * as React from '@theia/core/shared/react';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import filenamify from 'filenamify';
import { VesCommonService } from '../../../branding/browser/ves-common-service';
import { VesProjectsPathsService } from '../ves-projects-paths-service';
import { VesProjectsPreferenceIds } from '../ves-projects-preferences';

export interface VesNewProjectFormComponentProps {
    fileService: FileService
    fileDialogService: FileDialogService
    preferenceService: PreferenceService
    vesCommonService: VesCommonService
    vesProjectsPathsService: VesProjectsPathsService
}

export interface VesNewProjectFormComponentState {
    name: string
    gameCode: string
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
    labels: {
        name: Array<string>
        gameCode: string
        authors: Array<string>
        description: string
        headerName: string
        makerCode: string
    }
}

export const VES_NEW_PROJECT_TEMPLATES: VesNewProjectTemplate[] = [{
    name: 'Barebone',
    id: 'vuengine-barebone',
    description: 'An (almost) empty project that includes a single "Hello World" screen plus the most important plugins to add splash screens, automatic pause and more.',
    labels: {
        name: [
            'VUEngine Barebone'
        ],
        gameCode: 'VXXM',
        authors: [
            'Jorge Eremiev <jorgech3@gmail.com> and Christian Radke <c.radke@posteo.de>'
        ],
        description: 'Barebone project to be used as the foundation of new VUEngine projects.',
        headerName: 'VUENGINE PROJECT',
        makerCode: 'VU',
    }
}, {
    name: 'Platform Game',
    id: 'vuengine-platformer-demo',
    description: 'A full featured single level platforming game.',
    labels: {
        name: [
            'VUEngine Platformer Demo'
        ],
        gameCode: 'VVPM',
        authors: [
            'Jorge Eremiev <jorgech3@gmail.com> and Christian Radke <c.radke@posteo.de>'
        ],
        description: 'A platform demo game created using VUEngine to show off some of the engine\'s capabilities.',
        headerName: 'VUENGINE PLATFORMER',
        makerCode: 'VU'
    }
}, {
    name: 'Multiplayer Game',
    id: 'spong',
    description: 'A simple Pong-like game that utilizes the engine\'s communication class for multiplayer matches over a link cable.',
    labels: {
        name: [
            'SPONG'
        ],
        gameCode: 'VSPM',
        authors: [
            'Jorge Eremiev <jorgech3@gmail.com> and Christian Radke <c.radke@posteo.de>'
        ],
        description: 'A simple Pong-like game that demonstrates VUEngine\'s multiplayer capabilities.',
        headerName: 'SPONG',
        makerCode: 'VU'
    }
}, {
    name: 'Image Viewer',
    id: 'vue-master',
    description: 'Stereo image viewer.',
    labels: {
        name: [
            'VUE-MASTER'
        ],
        gameCode: 'VVME',
        authors: [
            'STEREO BOY and KR155E'
        ],
        // eslint-disable-next-line max-len
        description: 'VUE-MASTER (read: "View Master") is a take on the classic toy stereo image viewer. It\'s a Virtual Boy stereo viewer by Stereo Boy and KR155E, containing several stereo images. First and foremost, though, it is meant as a VUEngine template which allows anyone to compile their own stereo images into a ROM to view on real Virtual Boy hardware, without any programming knowledge.',
        headerName: 'VUE-MASTER',
        makerCode: 'CR'
    }
}];

export class VesNewProjectFormComponent extends React.Component<VesNewProjectFormComponentProps, VesNewProjectFormComponentState> {
    protected fileService: FileService;
    protected fileDialogService: FileDialogService;
    protected preferenceService: PreferenceService;
    protected vesCommonService: VesCommonService;
    protected vesProjectsPathsService: VesProjectsPathsService;

    protected nameInputComponentRef: React.RefObject<HTMLInputElement> = React.createRef();

    constructor(props: VesNewProjectFormComponentProps) {
        super(props);

        this.fileService = props.fileService;
        this.fileDialogService = props.fileDialogService;
        this.preferenceService = props.preferenceService;
        this.vesCommonService = props.vesCommonService;
        this.vesProjectsPathsService = props.vesProjectsPathsService;

        this.state = {
            name: 'My Project',
            template: 0,
            gameCode: 'MP',
            author: '',
            makerCode: '',
            path: '',
            folder: 'my-project',
            isCreating: false
        };

        this.preferenceService.ready.then(async () => this.setStateFromPreferences());

        this.preferenceService.onPreferenceChanged(async ({ preferenceName, newValue }) => {
            switch (preferenceName) {
                case VesProjectsPreferenceIds.BASE_PATH:
                case VesProjectsPreferenceIds.AUTHOR:
                case VesProjectsPreferenceIds.MAKER_CODE:
                    await this.setStateFromPreferences();
                    break;
            }
        });
    }

    protected async setStateFromPreferences(): Promise<void> {
        this.setState({
            author: this.preferenceService.get(VesProjectsPreferenceIds.AUTHOR) as string,
            makerCode: this.preferenceService.get(VesProjectsPreferenceIds.MAKER_CODE) as string,
            path: await this.fileService.fsPath(await this.vesProjectsPathsService.getProjectsBaseUri()),
        });
    }

    render(): JSX.Element {
        return <>
            <div style={{ width: 600 }} />
            <div style={{ display: 'flex' }}>
                <div style={{ flexGrow: 1, paddingRight: 8 }}>
                    <div className="ves-new-project-input-label">Name</div>
                    <input
                        type="text"
                        className="theia-input"
                        value={this.state.name}
                        onChange={this.updateName}
                        disabled={this.state.isCreating}
                        style={{ boxSizing: 'border-box', width: '100%' }}
                        tabIndex={1}
                        ref={this.nameInputComponentRef}
                    />
                </div>
                <div>
                    <div className="ves-new-project-input-label">Game Code</div>
                    <input
                        type="text"
                        className="theia-input"
                        value={this.state.gameCode}
                        onChange={this.updateGameCode}
                        disabled={this.state.isCreating}
                        size={10}
                        maxLength={2}
                        minLength={2}
                        tabIndex={2}
                    />
                </div>
            </div>
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
                        tabIndex={3}
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
                        size={10}
                        maxLength={2}
                        minLength={2}
                        tabIndex={4}
                    />
                </div>
            </div>
            <br />
            <div className="ves-new-project-input-label">Path</div>
            <div style={{ display: 'flex' }}>
                <input
                    type="text"
                    className="theia-input"
                    value={this.vesCommonService.formatPath(this.state.path)}
                    onChange={this.updatePathFolder}
                    size={this.state.path.length}
                    style={{ fontFamily: 'monospace', maxWidth: 332 }}
                    disabled={this.state.isCreating}
                    tabIndex={5}
                />
                <button
                    className="theia-button secondary"
                    onClick={this.selectProjectFolder}
                    style={{ marginLeft: 0, minWidth: 40, paddingBottom: 0 }}
                    disabled={this.state.isCreating}
                    tabIndex={6}
                >
                    <i
                        style={{ fontSize: 16, verticalAlign: 'bottom' }}
                        className="fa fa-ellipsis-h"
                    />
                </button>
                <span className="ves-new-project-path-separator">
                    {isWindows ? '\\' : '/'}
                </span>
                <input
                    type="text"
                    className="theia-input"
                    value={this.state.folder}
                    onChange={this.updatePathName}
                    style={{ flexGrow: 1, fontFamily: 'monospace' }}
                    disabled={this.state.isCreating}
                    tabIndex={7}
                />
            </div>
            <br />
            <div className="ves-new-project-input-label">Template</div>
            <div className="ves-new-project-templates-container" onKeyDown={this.handleTemplateKeyPress} tabIndex={8}>
                {VES_NEW_PROJECT_TEMPLATES.map((template, index) => {
                    const selected = index === this.state.template ? ' selected' : '';
                    return <div
                        key={`ves-new-project-template-${index}`}
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

    protected handleTemplateKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'ArrowLeft') {
            if (this.state.template === 0) {
                this.updateTemplate(VES_NEW_PROJECT_TEMPLATES.length - 1);
            } else {
                this.updateTemplate(this.state.template - 1);
            }
        } else if (e.key === 'ArrowRight') {
            if (this.state.template === VES_NEW_PROJECT_TEMPLATES.length - 1) {
                this.updateTemplate(0);
            } else {
                this.updateTemplate(this.state.template + 1);
            }
        }
    };

    protected updateName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        name: e.currentTarget.value,
        gameCode: this.makeGameCode(e.currentTarget.value),
        folder: this.getPathName(e.currentTarget.value),
    });

    protected updateGameCode = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        gameCode: e.currentTarget.value,
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
        path: this.vesCommonService.formatPath(e.currentTarget.value)
    });

    protected updatePathName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        folder: e.currentTarget.value
    });

    protected makeGameCode(name: string): string {
        const nameparts = name.trim().split(' ');
        if (nameparts.length > 1) {
            return `${nameparts[0][0]}${nameparts[1][0]}`.toUpperCase();
        } else {
            return name.substring(0, 2).padEnd(2, 'X').toUpperCase();
        }
    }

    protected getPathName(name: string): string {
        return filenamify(name, { replacement: ' ' })
            .replace(/\s+/g, '-')
            .toLowerCase();
    }

    protected selectProjectFolder = async (): Promise<void> => {
        const props: OpenFileDialogProps = {
            title: "Select new project's parent folder",
            canSelectFolders: true,
            canSelectFiles: false
        };
        const currentPath = await this.fileService.exists(new URI(this.state.path).withScheme('file'))
            ? await this.fileService.resolve(new URI(this.state.path).withScheme('file'))
            : undefined;
        const destinationFolderUri = await this.fileDialogService.showOpenDialog(props, currentPath);
        if (destinationFolderUri) {
            const destinationFolder = await this.fileService.resolve(destinationFolderUri);
            if (destinationFolder.isDirectory) {
                this.setState({
                    path: this.vesCommonService.formatPath(destinationFolder.resource.path.toString())
                });
            }
        }
    };

    protected removeTrailingSlash(path: string): string {
        return path.replace(/\/$/, '');
    }

    focusNameInput(): void {
        this.nameInputComponentRef.current?.select();
    }
}
