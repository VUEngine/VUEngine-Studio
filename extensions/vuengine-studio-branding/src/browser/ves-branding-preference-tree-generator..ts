import { injectable } from 'inversify';
import { COMMONLY_USED_SECTION_PREFIX, PreferenceTreeGenerator } from '@theia/preferences/lib/browser/util/preference-tree-generator';

import { VesUpdaterPreferenceIds } from 'vuengine-studio-updater/lib/electron-browser/ves-updater-preferences';

@injectable()
export class VesPreferenceTreeGenerator extends PreferenceTreeGenerator {

    // reorder preferences categories and add custom ones

    protected readonly topLevelCategories = new Map([
        [COMMONLY_USED_SECTION_PREFIX, 'Commonly Used'],
        ['application', 'Application'],
        ['build', 'Build'], // custom category
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
        ['debug', 'features'],
        ['emulator', 'features'], // custom category
        ['flash-carts', 'features'], // custom category
        ['explorer', 'features'],
        ['extensions', 'features'],
        ['hosted-plugin', 'features'],
        ['output', 'features'],
        ['preview', 'features'],
        ['problems', 'features'],
        ['projects', 'features'], // custom category
        ['search', 'features'],
        ['task', 'features'],
        ['terminal', 'features'],
        [VesUpdaterPreferenceIds.CATEGORY, 'features'], // custom category
        ['webview', 'features'],
    ]);
}
