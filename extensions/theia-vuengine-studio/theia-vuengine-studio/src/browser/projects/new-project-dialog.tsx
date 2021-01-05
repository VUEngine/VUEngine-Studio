import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { DialogProps } from "@theia/core/lib/browser/dialogs";
import { ReactDialog } from "@theia/core/lib/browser/dialogs/react-dialog";
import { Message } from "@theia/core/lib/browser/widgets/widget";
import { FileDialogService, OpenFileDialogProps } from "@theia/filesystem/lib/browser";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { EnvVariablesServer } from "@theia/core/lib/common/env-variables";
import { VesProjectsBaseFolderPreference } from "./preferences";
import { PreferenceService } from "@theia/core/lib/browser";

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
            title: "New Project"
        });
        this.appendCloseButton("Cancel");
        this.appendAcceptButton("Create");
    }

    @postConstruct()
    protected async init(): Promise<void> {
        this.update();
    }

    protected render(): React.ReactNode {
        const path = this.preferenceService.get(VesProjectsBaseFolderPreference.id) as string;
        return <>
            <div className="ves-new-project-input-label">Name</div>
            <input type="text" className="theia-input"></input>
            <br />
            <div className="ves-new-project-input-label">Template</div>
            <select className="theia-select">
                <option value="vuengine-barebone">Barebone</option>
            </select>
            <br />
            <div className="ves-new-project-input-label">Path</div>
            <input
                type="text"
                className="theia-input"
                value={path}
                onClick={() => this.selectProjectFolder(this.fileDialogService)}></input>
            <br />
            <br />
        </>;
    }

    protected async selectProjectFolder(fileDialogService: FileDialogService) {
        const props: OpenFileDialogProps = {
            title: "Select new project's parent folder",
            canSelectFolders: true,
            canSelectFiles: false
        };
        const destinationFolderUri = await fileDialogService.showOpenDialog(props);
        if (destinationFolderUri) {
            const destinationFolder = await this.fileService.resolve(destinationFolderUri);
            if (destinationFolder.isDirectory) {
            }
        }
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
