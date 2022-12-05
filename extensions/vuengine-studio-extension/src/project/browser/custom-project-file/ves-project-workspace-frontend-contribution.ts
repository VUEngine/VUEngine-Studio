import { environment, OS } from '@theia/core';
import { UTF8 } from '@theia/core/lib/common/encodings';
import { nls } from '@theia/core/lib/common/nls';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { FileDialogTreeFilters, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { WorkspaceCommands, WorkspaceFrontendContribution } from '@theia/workspace/lib/browser';
import { VesEncodingOverride } from 'src/core/browser/ves-encoding-registry';
import { VUENGINE_EXT } from '../../common/custom-project-file/ves-project-utils';
import { ProjectFileTemplateEncoding } from '../ves-project-types';

@injectable()
export class VesWorkspaceFrontendContribution extends WorkspaceFrontendContribution {
    configure(): void {
        super.configure();

        this.encodingRegistry.registerOverride({ encoding: UTF8, extension: VUENGINE_EXT });
        this.encodingRegistry.registerOverride({ encoding: ProjectFileTemplateEncoding.win1252, endsWith: 'LanguageSpec.c' } as VesEncodingOverride);

        this.updateEncodingOverrides();
    }

    protected async saveWorkspaceAs(): Promise<boolean> {
        let exist: boolean = false;
        let overwrite: boolean = false;
        let selected: URI | undefined;
        do {
            selected = await this.fileDialogService.showSaveDialog({
                title: WorkspaceCommands.SAVE_WORKSPACE_AS.label!,
                filters: VesWorkspaceFrontendContribution.VES_DEFAULT_FILE_FILTER
            });
            if (selected) {
                const displayName = selected.displayName;
                if (!displayName.endsWith(`.${VUENGINE_EXT}`)) {
                    selected = selected.parent.resolve(`${displayName}.${VUENGINE_EXT}`);
                }
                exist = await this.fileService.exists(selected);
                if (exist) {
                    overwrite = await this.saveService.confirmOverwrite(selected);
                }
            }
        } while (selected && exist && !overwrite);

        if (selected) {
            try {
                await this.workspaceService.save(selected);
                return true;
            } catch {
                this.messageService.error(nls.localizeByDefault('Unable to save workspace {0}', selected.path.fsPath()));
            }
        }
        return false;
    }

    protected async openWorkspaceOpenFileDialogProps(): Promise<OpenFileDialogProps> {
        await this.preferences.ready;
        const type = OS.type();
        const electron = environment.electron.is();
        return VesWorkspaceFrontendContribution.createOpenWorkspaceOpenFileDialogProps({
            type,
            electron,
        });
    }
}

export namespace VesWorkspaceFrontendContribution {
    export const VES_DEFAULT_FILE_FILTER: FileDialogTreeFilters = {
        'VUEngine Studio Project': [VUENGINE_EXT]
    };

    export function createOpenWorkspaceOpenFileDialogProps(options: Readonly<{ type: OS.Type, electron: boolean }>): OpenFileDialogProps {
        const { electron, type } = options;
        const title = WorkspaceCommands.OPEN_WORKSPACE.dialogLabel;
        // If browser
        if (!electron) {
            return {
                title,
                canSelectFiles: true,
                canSelectFolders: true,
                filters: VES_DEFAULT_FILE_FILTER
            };
        }

        // If electron
        if (OS.Type.OSX === type) {
            // `Finder` can select folders and files at the same time. We allow folders and workspace files.
            return {
                title,
                canSelectFiles: true,
                canSelectFolders: true,
                filters: VES_DEFAULT_FILE_FILTER
            };
        }

        return {
            title,
            canSelectFiles: false,
            canSelectFolders: true
        };
    }
}
