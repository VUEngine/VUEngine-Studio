import { PreferenceService } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { WorkspaceData, WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesPluginsPathsService } from '../../plugins/browser/ves-plugins-paths-service';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';

@injectable()
export class VesWorkspaceService extends WorkspaceService {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesBuildPathsService)
    protected readonly vesBuildPathsService: VesBuildPathsService;
    @inject(VesPluginsPathsService)
    protected readonly vesPluginsPathsService: VesPluginsPathsService;

    @postConstruct()
    protected init(): void {
        super.init();

        this.preferenceService.onPreferenceChanged(async ({ preferenceName }) => {
            if (this.opened) {
                switch (preferenceName) {
                    case VesBuildPreferenceIds.ENGINE_CORE_PATH:
                    case VesBuildPreferenceIds.ENGINE_CORE_INCLUDE_IN_WORKSPACE:
                    case VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH:
                    case VesPluginsPreferenceIds.ENGINE_PLUGINS_INCLUDE_IN_WORKSPACE:
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

    protected async getWorkspaceDataFromFile(): Promise<WorkspaceData | undefined> {
        const workspaceData = await super.getWorkspaceDataFromFile();
        return this.addEngineFolders(workspaceData);
    }

    protected async addEngineFolders(workspaceData: WorkspaceData | undefined): Promise<WorkspaceData> {
        if (!workspaceData) {
            workspaceData = { folders: [] };
        }

        const engineCoreInclude = this.preferenceService.get<boolean>(VesBuildPreferenceIds.ENGINE_CORE_INCLUDE_IN_WORKSPACE);
        if (engineCoreInclude) {
            const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
            const enginePathWithScheme = engineCoreUri.withScheme(engineCoreUri.scheme).toString();
            if (!workspaceData.folders.filter(f => f.path === enginePathWithScheme).length) {
                workspaceData.folders.push({
                    path: enginePathWithScheme,
                    name: 'VUEngine Core',
                });
            }
        }

        const enginePluginsInclude = this.preferenceService.get<boolean>(VesPluginsPreferenceIds.ENGINE_PLUGINS_INCLUDE_IN_WORKSPACE);
        if (enginePluginsInclude) {
            const enginePluginsUri = await this.vesPluginsPathsService.getEnginePluginsUri();
            const enginePluginsPathWithScheme = enginePluginsUri.withScheme(enginePluginsUri.scheme).toString();
            if (!workspaceData.folders.filter(f => f.path === enginePluginsPathWithScheme).length) {
                workspaceData.folders.push({
                    path: enginePluginsPathWithScheme,
                    name: 'VUEngine Plugins',
                });
            }
        }

        const userPluginsInclude = this.preferenceService.get<boolean>(VesPluginsPreferenceIds.USER_PLUGINS_INCLUDE_IN_WORKSPACE);
        if (userPluginsInclude) {
            const userPluginsUri = await this.vesPluginsPathsService.getUserPluginsUri();
            const userPluginsPathWithScheme = userPluginsUri.withScheme(userPluginsUri.scheme).toString();
            if (!workspaceData.folders.filter(f => f.path === userPluginsPathWithScheme).length) {
                workspaceData.folders.push({
                    path: userPluginsPathWithScheme,
                    name: 'User Plugins',
                });
            }
        }

        return workspaceData;
    }
}
