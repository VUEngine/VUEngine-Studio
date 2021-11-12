import { join as joinPath } from 'path';
import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { Message } from '@theia/core/lib/browser/widgets/widget';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { Key, PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { VesNewProjectFormComponent, VES_NEW_PROJECT_TEMPLATES } from './ves-projects-new-project-form';
import { VesProjectsPreferenceIds } from '../ves-projects-preferences';
import { VesProjectsService } from '../ves-projects-service';

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
    @inject(VesProjectsService)
    protected readonly vesProjectsService: VesProjectsService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected createProjectFormComponentRef: React.RefObject<VesNewProjectFormComponent> = React.createRef();
    protected isCreating: boolean = false;

    constructor(
        @inject(VesNewProjectDialogProps)
        protected readonly props: VesNewProjectDialogProps
    ) {
        super({
            title: 'Create New Project',
            maxWidth: 600
        });

        this.appendCloseButton();
        this.appendAcceptButton('Create');

        if (this.closeButton) {
            this.closeButton.tabIndex = 9;
        }
        if (this.acceptButton) {
            this.acceptButton.tabIndex = 10;
        }
    }

    @postConstruct()
    protected async init(): Promise<void> {
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

        this.setStatusMessage(`${spinnerIcon} Verifying...`);

        const name = this.createProjectFormComponentRef.current?.state.name;
        const gameCode = this.createProjectFormComponentRef.current?.state.gameCode || '';
        const author = this.createProjectFormComponentRef.current?.state.author || '';
        const makerCode = this.createProjectFormComponentRef.current?.state.makerCode || '';

        if (!name) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} Error: no project name provided`);
            return;
        }

        const projectsBaseFolder = this.preferenceService.get(VesProjectsPreferenceIds.BASE_FOLDER) as string;
        const basePath = this.createProjectFormComponentRef.current?.state.path ?? projectsBaseFolder;
        const basePathUri = new URI(basePath);
        const pathExists = await this.fileService.exists(basePathUri) && (await this.fileService.resolve(basePathUri)).isDirectory;

        if (!pathExists) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} Error: base path does not exist`);
            return;
        }

        this.setStatusMessage(`${spinnerIcon} Setting up new project...`);

        const templateIndex = this.createProjectFormComponentRef.current?.state.template ?? 0;
        const template = VES_NEW_PROJECT_TEMPLATES[templateIndex];
        const folder = this.createProjectFormComponentRef.current?.state.folder ?? 'new-project';
        const newProjectPath = joinPath(basePath, folder);
        const newProjectWorkspaceFileUri = new URI(joinPath(basePath, `${folder}.theia-workspace`));

        const response = await this.vesProjectsService.createProjectFromTemplate(
            template,
            folder,
            newProjectPath,
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
