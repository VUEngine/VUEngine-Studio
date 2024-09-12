import { PreferenceService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileNavigatorFilter } from '@theia/navigator/lib/browser/navigator-filter';
import { VesBuildPreferenceIds } from './ves-build-preferences';

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

        this.preferenceService.onPreferenceChanged(({ preferenceName, newValue }) => {
            if (preferenceName === VesBuildPreferenceIds.HIDE_BUILD_FOLDER) {
                this.filterPredicate = this.createFilterPredicate(newValue as FileNavigatorFilter.Exclusions | undefined || {});
                this.fireFilterChanged();
            }
        });
    }
}
