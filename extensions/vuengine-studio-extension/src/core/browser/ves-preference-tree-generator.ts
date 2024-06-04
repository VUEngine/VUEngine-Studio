import { injectable, postConstruct } from '@theia/core/shared/inversify';
import { COMMONLY_USED_SECTION_PREFIX, PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesFlashCartPreferenceIds } from '../../flash-cart/browser/ves-flash-cart-preferences';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';
import { VesProjectPreferenceIds } from '../../project/browser/ves-project-preferences';
import { VesUpdaterPreferenceIds } from '../../updater/browser/ves-updater-preferences';

@injectable()
export class VesPreferenceTreeGenerator extends PreferenceTreeGenerator {
    @postConstruct()
    protected init(): void {
        // this.topLevelCategories
        //    .set(VesBuildPreferenceIds.CATEGORY, 'Build');

        this.sectionAssignments
            .set(VesEmulatorPreferenceIds.CATEGORY, 'features')
            .set(VesFlashCartPreferenceIds.CATEGORY, 'features')
            .set(VesPluginsPreferenceIds.CATEGORY, VesBuildPreferenceIds.CATEGORY)
            .set(VesProjectPreferenceIds.CATEGORY, 'features')
            .set(VesUpdaterPreferenceIds.CATEGORY, 'features')
            .set('editor', 'editors')
            .set('debug', '');

        super.init();
    }

    protected readonly topLevelCategories = new Map([
        [COMMONLY_USED_SECTION_PREFIX, 'Commonly Used'],
        ['editors', 'Editors'], // custom category
        ['workbench', 'Workbench'],
        ['window', 'Window'],
        [VesBuildPreferenceIds.CATEGORY, 'Build'], // custom category
        ['features', 'Features'],
        ['application', 'Application'],
        ['security', 'Security'],
        ['extensions', 'Extensions']
    ]);
}
