import { injectable } from '@theia/core/shared/inversify';
import { COMMONLY_USED_SECTION_PREFIX, PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesFlashCartPreferenceIds } from '../../flash-cart/browser/ves-flash-cart-preferences';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';
import { VesProjectsPreferenceIds } from '../../projects/browser/ves-projects-preferences';
import { VesUpdaterPreferenceIds } from '../../updater/electron-browser/ves-updater-preferences';
import { VesBrandingPreferenceIds } from './ves-branding-preferences';

@injectable()
export class VesPreferenceTreeGenerator extends PreferenceTreeGenerator {

    // reorder preferences categories and add custom ones
    // TODO: keep up to date (or, better yet, figure our a better solution to add custom categories)

    protected readonly topLevelCategories = new Map([
        [COMMONLY_USED_SECTION_PREFIX, 'Commonly Used'],
        ['editor', 'Text Editor'],
        ['workbench', 'Workbench'],
        ['window', 'Window'],
        [VesBuildPreferenceIds.CATEGORY, 'Build'], // custom category
        ['features', 'Features'],
        ['application', 'Application'],
        ['security', 'Security'],
        ['extensions', 'Extensions']
    ]);

    protected readonly sectionAssignments = new Map([
        ['breadcrumbs', 'workbench'],
        ['comments', 'features'],
        // ['debug', 'features'], // remove debug
        ['diffEditor', 'editor'],
        [VesEmulatorPreferenceIds.CATEGORY, 'features'], // custom category
        [VesFlashCartPreferenceIds.CATEGORY, 'features'], // custom category
        ['explorer', 'features'],
        ['extensions', 'features'],
        [VesBrandingPreferenceIds.CATEGORY, 'features'], // custom category
        ['files', 'editor'],
        ['hosted-plugin', 'features'],
        ['keyboard', 'application'],
        ['output', 'features'],
        [VesPluginsPreferenceIds.CATEGORY, VesBuildPreferenceIds.CATEGORY], // custom category
        ['problems', 'features'],
        ['preview', 'features'],
        [VesProjectsPreferenceIds.CATEGORY, 'features'], // custom category
        ['search', 'features'],
        ['task', 'features'],
        ['terminal', 'features'],
        [VesUpdaterPreferenceIds.CATEGORY, 'features'], // custom category
        ['webview', 'features'],
        ['workspace', 'application'],
    ]);
}
