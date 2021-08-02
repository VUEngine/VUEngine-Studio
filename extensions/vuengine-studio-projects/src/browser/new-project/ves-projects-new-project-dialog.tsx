import { join as joinPath } from 'path';
import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { Message } from '@theia/core/lib/browser/widgets/widget';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { Key, PreferenceService } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';

import { VesNewProjectFormComponent } from './ves-projects-new-project-form';
import { VesProjectsPreferenceIds } from '../ves-projects-preferences';

@injectable()
export class VesNewProjectDialogProps extends DialogProps {
}

@injectable()
export class VesNewProjectDialog extends ReactDialog<void> {

    @inject(EnvVariablesServer)
    protected readonly envVariablesServer: EnvVariablesServer;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected createProjectFormComponent: React.RefObject<VesNewProjectFormComponent> = React.createRef();
    protected isCreating: boolean = false;

    constructor(
        @inject(VesNewProjectDialogProps)
        protected readonly props: VesNewProjectDialogProps
    ) {
        super({
            title: 'New Project',
            maxWidth: 600
        });

        this.appendCloseButton();
        this.appendAcceptButton('Create');
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.update();
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
            ref={this.createProjectFormComponent}
        />;
    }

    protected async createProject(): Promise<void> {
        if (this.isCreating) {
            return;
        };

        const spinnerIcon = '<i class="fa fa-refresh fa-spin"></i>';
        const warningIcon = '<i class="fa fa-warning"></i>';

        this.setIsCreating(true);

        this.setStatusMessage(`${spinnerIcon} Verifying...`);

        const name = this.createProjectFormComponent.current?.state.name;

        if (!name) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} Error: no project name provided`);
            return;
        }

        const projectsBaseFolder = this.preferenceService.get(VesProjectsPreferenceIds.BASE_FOLDER) as string;
        const path = this.createProjectFormComponent.current?.state.path ?? projectsBaseFolder;
        const pathUri = new URI(path);
        const pathExists = await this.fileService.exists(pathUri) && (await this.fileService.resolve(pathUri)).isDirectory;

        if (!pathExists) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} Error: base path does not exist`);
            return;
        }

        this.setStatusMessage(`${spinnerIcon} Setting up new project...`);

        const template = this.createProjectFormComponent.current?.state.template ?? 'vuengine-barebone';
        const folder = this.createProjectFormComponent.current?.state.folder ?? 'new-project';

        const templateFolderUri = new URI(await this.getTemplateFolder(template));
        const newProjectFolderUri = new URI(joinPath(path, folder));

        await this.fileService.copy(templateFolderUri, newProjectFolderUri);

        // TODO: adjust new folder with custom name and maker code

        await this.accept();
        this.workspaceService.open(newProjectFolderUri);
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.update();
    }

    protected async getTemplateFolder(template: string): Promise<string> {
        const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
        const applicationPath = envVar && envVar.value ? envVar.value : '';
        return joinPath(applicationPath, 'vuengine', template);
    }

    protected setIsCreating(isCreating: boolean): void {
        this.isCreating = isCreating;

        this.createProjectFormComponent.current?.setState({
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
