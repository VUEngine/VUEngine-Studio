import { injectable } from '@theia/core/shared/inversify';
import { COMMONLY_USED_SECTION_PREFIX, PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesFlashCartPreferenceIds } from '../../flash-cart/browser/ves-flash-cart-preferences';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesProjectsPreferenceIds } from '../../projects/browser/ves-projects-preferences';
import { VesUpdaterPreferenceIds } from '../../updater/electron-browser/ves-updater-preferences';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';

@injectable()
export class VesPreferenceTreeGenerator extends PreferenceTreeGenerator {

    // reorder preferences categories and add custom ones
    // TODO: keep up to date (or, better yet, figure our a better solution to add custom categories)

    protected readonly topLevelCategories = new Map([
        [COMMONLY_USED_SECTION_PREFIX, 'Commonly Used'],
        ['application', 'Application'],
        [VesBuildPreferenceIds.CATEGORY, 'Build'], // custom category
        ['editor', 'Text Editor'],
        ['features', 'Features'],
        ['window', 'Window'],
        ['workbench', 'Workbench'],
        ['extensions', 'Extensions'],
    ]);

    protected readonly sectionAssignments = new Map([
        ['keyboard', 'application'],
        ['workspace', 'application'],

        ['diffEditor', 'editor'],
        ['files', 'editor'],

        ['comments', 'features'],
        // ['debug', 'features'], // remove debug
        [VesEmulatorPreferenceIds.CATEGORY, 'features'], // custom category
        [VesFlashCartPreferenceIds.CATEGORY, 'features'], // custom category
        ['explorer', 'features'],
        ['extensions', 'features'],
        ['hosted-plugin', 'features'],
        ['output', 'features'],
        ['preview', 'features'],
        ['problems', 'features'],
        [VesProjectsPreferenceIds.CATEGORY, 'features'], // custom category
        ['search', 'features'],
        ['task', 'features'],
        ['terminal', 'features'],
        [VesUpdaterPreferenceIds.CATEGORY, 'features'], // custom category
        [VesPluginsPreferenceIds.CATEGORY, VesBuildPreferenceIds.CATEGORY], // custom category
        ['webview', 'features'],
    ]);
}
