import { inject, injectable } from '@theia/core/shared/inversify';
import { FileNavigatorFilter } from '@theia/navigator/lib/browser/navigator-filter';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { PreferenceService } from '@theia/core';

@injectable()
export class VesFileNavigatorFilter extends FileNavigatorFilter {
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;

    protected createFilterPredicate(exclusions: FileNavigatorFilter.Exclusions): FileNavigatorFilter.Predicate {
        const hideBuildFolder = !!this.preferenceService.get(VesBuildPreferenceIds.HIDE_BUILD_FOLDER);
        return super.createFilterPredicate({
            ...exclusions,
            '**/build': hideBuildFolder,
        });
    }

    protected async doInit(): Promise<void> {
        super.doInit();

        this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
            if (preferenceName === VesBuildPreferenceIds.HIDE_BUILD_FOLDER) {
                this.filterPredicate = this.createFilterPredicate(this.filesPreferences['files.exclude']);
                this.fireFilterChanged();
            }
        });
    }
}
