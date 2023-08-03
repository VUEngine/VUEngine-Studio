import { isWindows, nls } from '@theia/core';
import { Key, PreferenceService } from '@theia/core/lib/browser';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { Message } from '@theia/core/lib/browser/widgets/widget';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesProjectCommands } from '../ves-project-commands';
import { VesProjectPathsService } from '../ves-project-paths-service';
import { VesProjectService } from '../ves-project-service';
import { VesNewProjectFormComponent, VES_NEW_PROJECT_TEMPLATES } from './ves-new-project-form';
import { VUENGINE_EXT } from '../ves-project-types';

@injectable()
export class VesNewProjectDialogProps extends DialogProps {
}

@injectable()
export class VesNewProjectDialog extends ReactDialog<void> {
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesProjectService)
    protected readonly vesProjectsService: VesProjectService;
    @inject(VesProjectPathsService)
    protected readonly vesProjectsPathsService: VesProjectPathsService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected createProjectFormComponentRef: React.RefObject<VesNewProjectFormComponent> = React.createRef();
    protected isCreating: boolean = false;

    constructor(
        @inject(VesNewProjectDialogProps)
        protected readonly props: VesNewProjectDialogProps
    ) {
        super({
            title: VesProjectCommands.NEW.label!,
            maxWidth: 600
        });

        this.appendCloseButton();
        this.appendAcceptButton(nls.localize('vuengine/projects/create', 'Create'));

        if (this.closeButton) {
            this.closeButton.tabIndex = 9;
        }
        if (this.acceptButton) {
            this.acceptButton.tabIndex = 10;
        }
    }

    @postConstruct()
    protected init(): void {
        this.update();
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);

        this.update();
        this.createProjectFormComponentRef.current?.focusNameInput();
    }

    close(): void {
        if (!this.isCreating) {
            super.close();
        };
    }

    protected addAcceptAction<K extends keyof HTMLElementEventMap>(element: HTMLElement, ...additionalEventTypes: K[]): void {
        this.addKeyListener(element, Key.ENTER, () => this.createProject(), ...additionalEventTypes);
    }

    protected render(): React.ReactNode {
        return <VesNewProjectFormComponent
            fileService={this.fileService}
            fileDialogService={this.fileDialogService}
            preferenceService={this.preferenceService}
            vesCommonService={this.vesCommonService}
            vesProjectsPathsService={this.vesProjectsPathsService}
            ref={this.createProjectFormComponentRef}
        />;
    }

    protected async createProject(): Promise<void> {
        if (this.isCreating) {
            return;
        };

        const spinnerIcon = '<i class="fa fa-cog fa-spin"></i>';
        const warningIcon = '<i class="fa fa-warning"></i>';

        this.setIsCreating(true);

        this.setStatusMessage(`${spinnerIcon} ${nls.localize('vuengine/projects/verifying', 'Verifying')}...`);

        const name = this.createProjectFormComponentRef.current?.state.name;
        const gameCode = this.createProjectFormComponentRef.current?.state.gameCode || '';
        const author = this.createProjectFormComponentRef.current?.state.author || '';
        const makerCode = this.createProjectFormComponentRef.current?.state.makerCode || '';

        if (!name) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} ${nls.localize('vuengine/projects/errorNoProjectName', 'Error: no project name provided')}`);
            return;
        }

        const projectsBaseUri = this.createProjectFormComponentRef.current?.state.path
            ? isWindows
                ? new URI(`/${this.createProjectFormComponentRef.current?.state.path.replace(/\\/g, '/')}`).withScheme('file')
                : new URI(this.createProjectFormComponentRef.current?.state.path).withScheme('file')
            : await this.vesProjectsPathsService.getProjectsBaseUri();
        const pathExists = await this.fileService.exists(projectsBaseUri)
            && (await this.fileService.resolve(projectsBaseUri)).isDirectory;

        if (!pathExists) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} ${nls.localize('vuengine/projects/errorBasePathDoesNotExist', 'Error: base path does not exist')}`);
            return;
        }

        this.setStatusMessage(`${spinnerIcon} ${nls.localize('vuengine/projects/settingUpNewProject', 'Setting up new project')}...`);

        const templateIndex = this.createProjectFormComponentRef.current?.state.template ?? 0;
        const template = VES_NEW_PROJECT_TEMPLATES[templateIndex];
        const folder = this.createProjectFormComponentRef.current?.state.folder ?? 'new-project';
        const newProjectUri = projectsBaseUri.resolve(folder);
        const newProjectWorkspaceFileUri = newProjectUri.resolve(`${folder}.${VUENGINE_EXT}`);

        const response = await this.vesProjectsService.createProjectFromTemplate(
            template,
            folder,
            newProjectUri,
            name,
            gameCode,
            author,
            makerCode,
        );
        if (response !== true) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} ${response}`);
            return;
        }

        await this.accept();
        this.workspaceService.open(newProjectWorkspaceFileUri);
    }

    protected setIsCreating(isCreating: boolean): void {
        this.isCreating = isCreating;

        this.createProjectFormComponentRef.current?.setState({
            isCreating: isCreating
        });

        if (this.closeButton) {
            this.closeButton.disabled = isCreating;
        }
        if (this.acceptButton) {
            this.acceptButton.disabled = isCreating;
        }
    }

    protected setStatusMessage(status: string): void {
        // eslint-disable-next-line no-unsanitized/property
        this.errorMessageNode.innerHTML = status;
    }

    get value(): undefined { return undefined; }
}
