import { isWindows, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { ReactDialog } from '@theia/core/lib/browser/dialogs/react-dialog';
import { Message } from '@theia/core/lib/browser/widgets/widget';
import { ApplicationInfo, ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { RequestService } from '@theia/core/shared/@theia/request';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesProjectCommands } from '../ves-project-commands';
import { VesProjectPathsService } from '../ves-project-paths-service';
import { VesProjectService } from '../ves-project-service';
import { VUENGINE_EXT } from '../ves-project-types';
import { VES_NEW_PROJECT_TEMPLATES, VesNewProjectFormComponent } from './ves-new-project-form';

@injectable()
export class VesNewProjectDialogProps extends DialogProps {
}

@injectable()
export class VesNewProjectDialog extends ReactDialog<void> {
    @inject(ApplicationServer)
    protected readonly appServer: ApplicationServer;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(RequestService)
    protected readonly requestService: RequestService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesProjectService)
    protected readonly vesProjectsService: VesProjectService;
    @inject(VesProjectPathsService)
    protected readonly vesProjectsPathsService: VesProjectPathsService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected applicationInfo: ApplicationInfo | undefined;
    protected createProjectFormComponentRef: React.RefObject<VesNewProjectFormComponent> = React.createRef();
    protected isCreating: boolean = false;

    constructor(
        @inject(VesNewProjectDialogProps)
        protected readonly props: VesNewProjectDialogProps
    ) {
        super({
            title: VesProjectCommands.NEW.label!,
            maxWidth: 650,
        });

        this.appendAcceptButton(nls.localize('vuengine/projects/create', 'Create'));

        if (this.acceptButton) {
            this.acceptButton.tabIndex = 11;
        }
    }

    protected handleEnter(event: KeyboardEvent): boolean | void {
        this.accept();
    }

    protected async accept(): Promise<void> {
        this.createProject();
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {
        this.applicationInfo = await this.appServer.getApplicationInfo();
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
        const pathExists = await this.fileService.exists(projectsBaseUri);
        const pathIsFile = pathExists && (await this.fileService.resolve(projectsBaseUri)).isFile;
        const folder = this.createProjectFormComponentRef.current?.state.folder ?? 'new-project';
        const newProjectUri = projectsBaseUri.resolve(folder);

        if (await this.fileService.exists(newProjectUri)) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} ${nls.localize('vuengine/projects/errorFolderAlreadyExists', 'Error: project path already exists')}`);
            return;
        }

        if (pathIsFile) {
            this.setIsCreating(false);
            this.setStatusMessage(`${warningIcon} ${nls.localize('vuengine/projects/errorBasePathIsFile', 'Error: base path is a file')}`);
            return;
        }

        if (!pathExists) {
            await this.fileService.createFolder(projectsBaseUri);
        }

        this.setStatusMessage(`${spinnerIcon} ${nls.localize('vuengine/projects/settingUpNewProject', 'Setting up new project...')}`);

        const templateIndex = this.createProjectFormComponentRef.current?.state.template ?? 0;
        const template = VES_NEW_PROJECT_TEMPLATES[templateIndex];
        const newProjectWorkspaceFileUri = newProjectUri.resolve(`${folder}.${VUENGINE_EXT}`);
        const useTagged = this.createProjectFormComponentRef.current?.state.useTagged;

        this.setStatusMessage(`${spinnerIcon} ${nls.localize('vuengine/projects/downloadingTemplate', 'Downloading template, this may take a moment...')}`);
        const templateArchiveUrl = useTagged
            ? `${template.repository}/archive/refs/tags/ves-v${this.applicationInfo && this.applicationInfo.version}.zip`
            : `${template.repository}/archive/master.zip`;
        const context = await this.requestService.request({ url: templateArchiveUrl });
        if (context.res.statusCode !== 200) {
            this.setIsCreating(false);
            this.setStatusMessage(
                `${warningIcon} ${nls.localize('vuengine/projects/couldNotDownloadFile', 'Could not download file from {0}', templateArchiveUrl)} (${context.res.statusCode})`
            );
            return;
        }

        const tempDir = window.electronVesCore.getTempDir();
        const templateArchiveFolderUri = new URI(tempDir);
        const templateArchiveFilename = `template-${this.vesCommonService.nanoid()}.zip`;
        const templateArchiveUri = templateArchiveFolderUri.resolve(templateArchiveFilename);
        await this.fileService.writeFile(templateArchiveUri, BinaryBuffer.wrap(context.buffer as Uint8Array));
        const result = await window.electronVesCore.decompress(templateArchiveUri.path.fsPath(), templateArchiveFolderUri.path.fsPath());
        await this.fileService.move(templateArchiveFolderUri.resolve(result[0]), newProjectUri);
        await this.fileService.delete(templateArchiveUri);

        const response = await this.vesProjectsService.createProjectFromTemplate(
            newProjectUri,
            template,
            folder,
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
