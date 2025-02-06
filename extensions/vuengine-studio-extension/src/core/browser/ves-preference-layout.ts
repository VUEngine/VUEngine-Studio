import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { DEFAULT_LAYOUT, PreferenceLayout, PreferenceLayoutProvider } from '@theia/preferences/lib/browser/util/preference-layout';
import { VesBuildPreferenceIds } from '../../build/browser/ves-build-preferences';
import { VesEditorsPreferenceIds } from '../../editors/browser/ves-editors-preferences';
import { VesEmulatorPreferenceIds } from '../../emulator/browser/ves-emulator-preferences';
import { VesFlashCartPreferenceIds } from '../../flash-cart/browser/ves-flash-cart-preferences';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';
import { VesProjectPreferenceIds } from '../../project/browser/ves-project-preferences';
import { VesUpdaterPreferenceIds } from '../../updater/browser/ves-updater-preferences';

@injectable()
export class VesPreferenceLayoutProvider extends PreferenceLayoutProvider {
    getLayout(): PreferenceLayout[] {
        const textEditorNode = DEFAULT_LAYOUT.slice(0, 1)[0];
        const featuresNode = DEFAULT_LAYOUT.slice(3, 4)[0];
        featuresNode.children = [
            ...featuresNode.children!.filter(c => c.id !== 'features.debug'),
            {
                id: `features.${VesProjectPreferenceIds.CATEGORY}`,
                label: nls.localize('vuengine/projects/project', 'Project'),
                settings: [`${VesProjectPreferenceIds.CATEGORY}.*`]
            },
            {
                id: `features.${VesUpdaterPreferenceIds.CATEGORY}`,
                label: nls.localize('vuengine/updater/updates', 'Updates'),
                settings: [`${VesUpdaterPreferenceIds.CATEGORY}.*`]
            },
        ];

        return [
            {
                id: VesEditorsPreferenceIds.CATEGORY,
                label: nls.localize('vuengine/editors/editors', 'Editors'),
                settings: [`${VesEditorsPreferenceIds.CATEGORY}.*`],
                children: [
                    {
                        ...textEditorNode,
                        id: `${VesEditorsPreferenceIds.CATEGORY}.${textEditorNode.id}`,
                    },
                    {

                        id: `${VesEditorsPreferenceIds.CATEGORY}.${VesEditorsPreferenceIds.CATEGORY_VSU_SANDBOX}`,
                        label: nls.localize('vuengine/editors/general/typeLabels/vsuSandbox', 'VSU Sandbox'),
                        settings: [`${VesEditorsPreferenceIds.CATEGORY}.${VesEditorsPreferenceIds.CATEGORY_VSU_SANDBOX}.*`],
                    },
                ]
            },
            {
                id: VesBuildPreferenceIds.CATEGORY,
                label: nls.localize('vuengine/build/build', 'Build'),
                settings: [`${VesBuildPreferenceIds.CATEGORY}.*`, `${VesPluginsPreferenceIds.CATEGORY}.*`],
            },
            {
                id: VesEmulatorPreferenceIds.CATEGORY,
                label: nls.localize('vuengine/emulator/emulator', 'Emulator'),
                settings: [`${VesEmulatorPreferenceIds.CATEGORY}.*`],
            },
            {
                id: VesFlashCartPreferenceIds.CATEGORY,
                label: nls.localize('vuengine/flashCarts/flashCarts', 'Flash Carts'),
                settings: [`${VesFlashCartPreferenceIds.CATEGORY}.*`],
            },
            ...DEFAULT_LAYOUT.slice(1, 3),
            featuresNode,
            ...DEFAULT_LAYOUT.slice(4),
        ];
    }
}
