import { CollaborationWorkspaceService } from '@theia/collaboration/lib/browser/collaboration-workspace-service';
import { Emitter, PreferenceService } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { WorkspaceData } from '@theia/workspace/lib/browser';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';

@injectable()
export class VesWorkspaceService extends CollaborationWorkspaceService {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesBuildPathsService)
    protected readonly vesBuildPathsService: VesBuildPathsService;
    @inject(VesPluginsPathsService)
    protected readonly vesPluginsPathsService: VesPluginsPathsService;

    protected readonly onDidChangeRootsEmitter = new Emitter<boolean>();
    readonly onDidChangeRoots = this.onDidChangeRootsEmitter.event;

    @postConstruct()
    protected init(): void {
        super.init();

        this.preferenceService.onPreferenceChanged(async ({ preferenceName }) => {
            if (this.opened) {
                switch (preferenceName) {
                    case VesBuildPreferenceIds.ENGINE_PATH:
                    case VesBuildPreferenceIds.ENGINE_INCLUDE_IN_WORKSPACE:
                    case VesPluginsPreferenceIds.USER_PLUGINS_PATH:
                    case VesPluginsPreferenceIds.USER_PLUGINS_INCLUDE_IN_WORKSPACE:
                        if (!this._workspace?.isDirectory) {
                            await this.computeRoots();
                            this.updateWorkspace();
                        }
                        break;
                }
            }
        });
    }

    isCollaboration(): boolean {
        return this.collabWorkspace !== undefined;
    }

    protected override async computeRoots(): Promise<FileStat[]> {
        const result: FileStat[] = await super.computeRoots();
        setTimeout(() => {
            this.onDidChangeRootsEmitter.fire(this.isCollaboration());
        }, 1);
        return result;
    }

    protected async getWorkspaceDataFromFile(): Promise<WorkspaceData | undefined> {
        const workspaceData = await super.getWorkspaceDataFromFile();
        return this.addEngineFolders(workspaceData);
    }

    protected async addEngineFolders(workspaceData: WorkspaceData | undefined): Promise<WorkspaceData> {
        if (!workspaceData) {
            workspaceData = { folders: [] };
        }

        const engineInclude = this.preferenceService.get<boolean>(VesBuildPreferenceIds.ENGINE_INCLUDE_IN_WORKSPACE);
        if (engineInclude) {
            const engineCoreUri = await this.vesBuildPathsService.getEngineUri();
            const enginePathWithScheme = engineCoreUri.withScheme(engineCoreUri.scheme).toString();
            if (!workspaceData.folders.filter(f => f.path === enginePathWithScheme).length) {
                workspaceData.folders.push({
                    path: enginePathWithScheme,
                    name: 'VUEngine',
                });
            }
        }

        const userPluginsInclude = this.preferenceService.get<boolean>(VesPluginsPreferenceIds.USER_PLUGINS_INCLUDE_IN_WORKSPACE);
        if (userPluginsInclude) {
            const engineCoreUri = await this.vesBuildPathsService.getEngineUri();
            const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
            const userPluginsPathWithScheme = userPluginsUri.withScheme(userPluginsUri.scheme).toString();
            if (!engineInclude || !engineCoreUri.isEqualOrParent(userPluginsUri)) {
                if (!workspaceData.folders.filter(f => f.path === userPluginsPathWithScheme).length) {
                    workspaceData.folders.push({
                        path: userPluginsPathWithScheme,
                        name: 'User Plugins',
                    });
                }
            }
        }

        return workspaceData;
    }
}
