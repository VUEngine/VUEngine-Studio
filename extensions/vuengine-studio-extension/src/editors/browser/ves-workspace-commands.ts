import { CommandRegistry, nls } from '@theia/core';
import { open } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceCommandContribution, WorkspaceCommands, WorkspaceRootUriAwareCommandHandler } from '@theia/workspace/lib/browser';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { VesNewFileDialog } from './ves-new-file-dialog';

@injectable()
export class VesWorkspaceCommandContribution extends WorkspaceCommandContribution {
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

    async registerCommands(commandRegistry: CommandRegistry): Promise<void> {
        super.registerCommands(commandRegistry);

        await this.vesProjectService.projectDataReady;
        const types = this.vesProjectService.getProjectDataTypes() || {};

        commandRegistry.unregisterCommand(WorkspaceCommands.NEW_FILE);
        commandRegistry.registerCommand(WorkspaceCommands.NEW_FILE, new WorkspaceRootUriAwareCommandHandler(this.workspaceService, this.selectionService, {
            execute: async uri => {
                const parent = await this.getDirectory(uri);
                if (parent) {
                    const parentUri = parent.resource;
                    let defaultExt = '.c / .h';
                    let defaultName = nls.localize('vuengine/editors/newFileDialog/untitled', 'Untitled');
                    let didMatchType = false;
                    if (!parentUri.isEqual(uri)) {
                        // if not on a folder, check if we can preset a type based on the filename
                        Object.keys(types).map(typeId => {
                            types[typeId].forFiles?.map(f => {
                                if ([uri.path.ext, uri.path.base].includes(f)) {
                                    defaultName = uri.path.name;
                                    defaultExt = types[typeId].file;
                                    didMatchType = true;
                                }
                            });
                        });
                    }
                    if (!didMatchType) {
                        // ... otherwise, try to match folder (and parent folder) name with a type name
                        Object.keys(types).map(typeId => {
                            if ([uri.path.base, uri.parent.path.base].includes(typeId)) {
                                defaultExt = types[typeId].file;
                            }
                        });
                    }
                    const dialog = new VesNewFileDialog({
                        title: nls.localizeByDefault('New File...'),
                        maxWidth: 500,
                        parentLabel: this.labelProvider.getLongName(parentUri) + '/',
                        types,
                        defaultName,
                        defaultExt,
                    });
                    dialog.open().then(async value => {
                        if (value) {
                            const createFile = async (n: string) => {
                                const fileUri = parentUri.resolve(n);
                                await this.fileService.create(fileUri);
                                this.fireCreateNewFile({ parent: parentUri, uri: fileUri });
                                open(this.openerService, fileUri);
                            };
                            const name = value.substring(0, value.indexOf('.'));
                            const extensions = value.substring(value.indexOf('.'));
                            if (extensions) {
                                extensions.split(' / ').forEach(async ext => createFile(name + ext));
                            } else {
                                createFile(name);
                            }
                        }
                    });
                }
            }
        }));
    }
}
