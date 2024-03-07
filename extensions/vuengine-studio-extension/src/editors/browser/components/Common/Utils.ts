import { QuickPickItem, QuickPickOptions, QuickPickService, nls } from '@theia/core';
import { VesProjectService } from '../../../../project/browser/ves-project-service';

export const showEntitySelection = async (quickPickService: QuickPickService, vesProjectService: VesProjectService, ignoreIds?: string[]): Promise<QuickPickItem | undefined> => {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
        title: nls.localize('vuengine/editors/selectEntity', 'Select Entity'),
        placeholder: nls.localize('vuengine/editors/selectEntityToAdd', 'Select an Entity to add...'),
    };
    const items: QuickPickItem[] = [];
    const entities = vesProjectService.getProjectDataItemsForType('Entity');
    if (entities) {
        Object.keys(entities).map(k => {
            if (!ignoreIds || !ignoreIds.includes(k)) {
                const entity = entities[k];
                // @ts-ignore
                if (entity._id) {
                    // @ts-ignore
                    items.push({ id: entity._id, label: entity.name || entity._id });
                }
            }
        });
    }

    return quickPickService.show(items, quickPickOptions);
};
