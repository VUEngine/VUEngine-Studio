import { isWindows, nls, PreferenceService } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import * as React from '@theia/core/shared/react';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import filenamify from 'filenamify';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { VesProjectPathsService } from '../ves-project-paths-service';
import { VesProjectPreferenceIds } from '../ves-project-preferences';

export interface VesNewProjectFormComponentProps {
    fileService: FileService
    fileDialogService: FileDialogService
    preferenceService: PreferenceService
    vesCommonService: VesCommonService
    vesProjectsPathsService: VesProjectPathsService
}

export interface VesNewProjectFormComponentState {
    name: string
    gameCode: string
    author: string
    makerCode: string
    template: number
    path: string
    folder: string,
    useTagged: boolean,
    isCreating: boolean
}

export interface VesNewProjectTemplate {
    id: string
    name: string
    repository: string,
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
    id: 'barebone',
    name: nls.localize('vuengine/projects/templates/bareboneTitle', 'Barebone'),
    repository: 'https://github.com/VUEngine/VUEngine-Barebone',
    description: nls.localize(
        'vuengine/projects/templates/bareboneDescription',
        'An (almost) empty project that includes a single custom state plus the most important plugins to add splash screens, automatic pause and more.'
    ),
    labels: {
        name: [
            'VUEngine Barebone'
        ],
        gameCode: 'VVBM',
        authors: [
            'Jorge Eremiev <jorgech3@gmail.com> and Christian Radke <c.radke@posteo.de>'
        ],
        description: 'Barebone project to be used as the foundation of new VUEngine projects.',
        headerName: 'VUENGINE BAREBONE',
        makerCode: 'VU',
    }
}, {
    id: 'showcase',
    name: nls.localize('vuengine/projects/templates/showcaseTitle', 'Showcase'),
    repository: 'https://github.com/VUEngine/VUEngine-Showcase',
    description: nls.localize(
        'vuengine/projects/templates/showcaseDescription',
        'Showcase project to be used as the foundation for learning about VUEngine\'s concepts and capabilities step by step \
through cleanly written and properly commented code.'
    ),
    labels: {
        name: [
            'VUEngine Showcase'
        ],
        gameCode: 'VVSM',
        authors: [
            'Jorge Eremiev <jorgech3@gmail.com> and Christian Radke <c.radke@posteo.de>'
        ],
        description: 'Showcase project to be used as the foundation for learning about VUEngine\'s concepts and capabilities.',
        headerName: 'VUENGINE SHOWCASE',
        makerCode: 'VU',
    }
}, /* {
    id: 'platformer',
    name: nls.localize('vuengine/projects/templates/platformerTitle', 'Platform Game'),
    repository: 'https://github.com/VUEngine/VUEngine-Platformer-Demo',
    description: nls.localize(
        'vuengine/projects/templates/platformerDescription',
        'A full featured single level platforming game.'
    ),
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
} */];

export class VesNewProjectFormComponent extends React.Component<VesNewProjectFormComponentProps, VesNewProjectFormComponentState> {
    protected fileService: FileService;
    protected fileDialogService: FileDialogService;
    protected preferenceService: PreferenceService;
    protected vesCommonService: VesCommonService;
    protected vesProjectsPathsService: VesProjectPathsService;

    protected nameInputComponentRef: React.RefObject<HTMLInputElement> = React.createRef();

    constructor(props: VesNewProjectFormComponentProps) {
        super(props);

        this.fileService = props.fileService;
        this.fileDialogService = props.fileDialogService;
        this.preferenceService = props.preferenceService;
        this.vesCommonService = props.vesCommonService;
        this.vesProjectsPathsService = props.vesProjectsPathsService;

        this.state = {
            name: nls.localize('vuengine/projects/myProject', 'My Project'),
            template: 0,
            gameCode: 'MP',
            author: '',
            makerCode: '',
            path: '',
            folder: 'my-project',
            useTagged: true,
            isCreating: false
        };

        this.preferenceService.ready.then(async () => this.setStateFromPreferences());

        this.preferenceService.onPreferenceChanged(async ({ preferenceName, newValue }) => {
            switch (preferenceName) {
                case VesProjectPreferenceIds.BASE_PATH:
                case VesProjectPreferenceIds.AUTHOR:
                case VesProjectPreferenceIds.MAKER_CODE:
                    await this.setStateFromPreferences();
                    break;
            }
        });
    }

    protected async setStateFromPreferences(): Promise<void> {
        this.setState({
            author: this.preferenceService.get(VesProjectPreferenceIds.AUTHOR) as string,
            makerCode: this.preferenceService.get(VesProjectPreferenceIds.MAKER_CODE) as string,
            path: await this.fileService.fsPath(await this.vesProjectsPathsService.getProjectsBaseUri()),
        });
    }

    render(): React.JSX.Element {
        return <VContainer gap={10} className='vesNewProjectDialogContainer'>
            <HContainer gap={10}>
                <VContainer grow={1}>
                    <label>
                        {nls.localizeByDefault('Name')}
                    </label>
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
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/projects/gameCode', 'Game Code')}
                    </label>
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
                </VContainer>
            </HContainer>
            <HContainer gap={10}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/projects/author', 'Author')}
                    </label>
                    <input
                        type="text"
                        className="theia-input"
                        value={this.state.author}
                        onChange={this.updateAuthor}
                        disabled={this.state.isCreating}
                        style={{ boxSizing: 'border-box', width: '100%' }}
                        tabIndex={3}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/projects/makerCode', 'Maker Code')}
                    </label>
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
                </VContainer>
            </HContainer>
            <VContainer>
                <label>
                    {nls.localizeByDefault('Path')}
                </label>
                <HContainer>
                    <input
                        type="text"
                        className="theia-input"
                        value={this.state.path}
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
                    <span>
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
                </HContainer>
            </VContainer>
            <VContainer gap={10}>
                <label>
                    {nls.localize('vuengine/projects/template', 'Template')}
                </label>
                <div className="vesNewProjectDialogTemplatesContainer" onKeyDown={this.handleTemplateKeyPress} tabIndex={8}>
                    {VES_NEW_PROJECT_TEMPLATES.map((template, index) => {
                        const selected = index === this.state.template ? ' selected' : '';
                        return <div
                            key={`ves-new-project-template-${index}`}
                            data-template={VES_NEW_PROJECT_TEMPLATES[this.state.template].id}
                            className={`vesNewProjectDialogTemplate ${template.id}${selected}`}
                            onClick={() => this.updateTemplate(index)}
                        ></div>;
                    })}
                </div>
                <VContainer>
                    <div>
                        {VES_NEW_PROJECT_TEMPLATES[this.state.template].name}
                    </div>
                    <div style={{ fontStyle: 'italic', minHeight: 40 }}>
                        {VES_NEW_PROJECT_TEMPLATES[this.state.template].description}
                    </div>
                </VContainer>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={this.state.useTagged}
                            onChange={this.toggleUseTagged}
                        />
                        {nls.localize('vuengine/projects/useTagged', 'Use tagged version')}
                    </label>
                    <div style={{ fontStyle: 'italic', minHeight: 40 }}>
                        {!this.state.useTagged && nls.localize(
                            'vuengine/projects/useTaggedWarning',
                            'Warning: unchecking this will download the latest version of the template. \
Compatibility with your version of VUEngine is not guaranteed.'
                        )}
                    </div>
                </VContainer>
            </VContainer>
        </VContainer>;
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
        path: e.currentTarget.value
    });

    protected updatePathName = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        folder: this.getPathName(e.currentTarget.value)
    });

    protected toggleUseTagged = (e: React.ChangeEvent<HTMLInputElement>) => this.setState({
        useTagged: e.currentTarget.checked
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
            .replace(/^\d+/, '') // remove leading numbers
            .replace(/^\s+/, '') // remove leading whitespaces
            .replace(/\s+/g, '-') // replace whitespaces with dashes
            .toLowerCase();
    }

    protected selectProjectFolder = async (): Promise<void> => {
        const props: OpenFileDialogProps = {
            title: nls.localize('vuengine/projects/selectParentFolder', "Select new project's parent folder"),
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
                    path: destinationFolder.resource.path.fsPath()
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
