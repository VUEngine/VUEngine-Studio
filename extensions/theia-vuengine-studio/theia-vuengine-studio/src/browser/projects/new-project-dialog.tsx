import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { DialogProps } from "@theia/core/lib/browser/dialogs";
import { ReactDialog } from "@theia/core/lib/browser/dialogs/react-dialog";
import { Message } from "@theia/core/lib/browser/widgets/widget";
import { FileDialogService } from "@theia/filesystem/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { EnvVariablesServer } from "@theia/core/lib/common/env-variables";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesNewProjectForm } from "./new-project-form";

@injectable()
export class VesNewProjectDialogProps extends DialogProps {
}

@injectable()
export class VesNewProjectDialog extends ReactDialog<void> {

    @inject(EnvVariablesServer) protected readonly envVariablesServer: EnvVariablesServer;
    @inject(FileService) protected readonly fileService: FileService;
    @inject(FileDialogService) protected readonly fileDialogService: FileDialogService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;

    constructor(
        @inject(VesNewProjectDialogProps) protected readonly props: VesNewProjectDialogProps
    ) {
        super({
            title: "New Project",
            maxWidth: 600
        });
        this.appendCloseButton("Cancel");
        this.appendAcceptButton("Create");
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.update();
    }

    protected render(): React.ReactNode {
        return <VesNewProjectForm
            fileService={this.fileService}
            fileDialogService={this.fileDialogService}
            preferenceService={this.preferenceService}
        />;
    }

    protected createProject() {
        //this.workspaceService.open(destinationFolderUri);
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.update();
    }

    get value(): undefined { return undefined; }
}
