import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { PreferenceService } from '@theia/core/lib/browser';
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
    protected async init(): Promise<void> {
        super.init();

        this.preferenceService.onPreferenceChanged(async ({ preferenceName }) => {
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
        });
    }

    protected async computeRoots(): Promise<FileStat[]> {
        const roots = await super.computeRoots();
        const engineRoots = await this.getEngineRoots();

        return [...roots, ...engineRoots];
    }

    protected async getEngineRoots(): Promise<Array<FileStat>> {
        const roots: Array<FileStat> = [];

        if (!this._workspace?.isDirectory) {
            const engineCoreInclude = this.preferenceService.get<boolean>(VesBuildPreferenceIds.ENGINE_CORE_INCLUDE_IN_WORKSPACE);
            if (engineCoreInclude) {
                const engineCorePath = await this.vesBuildPathsService.getEngineCorePath();
                const coreFileStat = await this.toFileStat(engineCorePath);
                if (coreFileStat && await this.fileService.exists(coreFileStat.resource)) {
                    roots.push(coreFileStat);
                }
            }

            const enginePluginsInclude = this.preferenceService.get<boolean>(VesPluginsPreferenceIds.ENGINE_PLUGINS_INCLUDE_IN_WORKSPACE);
            if (enginePluginsInclude) {
                const enginePluginsPath = await this.vesPluginsPathsService.getEnginePluginsPath();
                const pluginsFileStat = await this.toFileStat(enginePluginsPath);
                if (pluginsFileStat && await this.fileService.exists(pluginsFileStat.resource)) {
                    roots.push(pluginsFileStat);
                }
            }

            const userPluginsInclude = this.preferenceService.get<boolean>(VesPluginsPreferenceIds.USER_PLUGINS_INCLUDE_IN_WORKSPACE);
            if (userPluginsInclude) {
                const userPluginsPath = await this.vesPluginsPathsService.getUserPluginsPath();
                const userPluginsFileStat = await this.toFileStat(userPluginsPath);
                if (userPluginsFileStat && await this.fileService.exists(userPluginsFileStat.resource)) {
                    roots.push(userPluginsFileStat);
                }
            }
        }

        return roots;
    }
}
