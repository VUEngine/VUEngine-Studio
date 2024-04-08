import { QuickPickItem, QuickPickOptions, QuickPickService, isNumber, nls } from '@theia/core';
import { VesProjectService } from '../../../../project/browser/ves-project-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

export const clamp = (value: number, min: number, max: number, deflt: number = 0): number =>
    isNumber(value)
        ? Math.min(Math.max(value, min), max)
        : deflt;

export const showEntitySelection = async (
    workspaceService: WorkspaceService,
    quickPickService: QuickPickService,
    vesProjectService: VesProjectService,
    ignoreIds?: string[]
): Promise<QuickPickItem | undefined> => {
    await workspaceService.ready;
    const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
        return;
    }

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
                    items.push({
                        // @ts-ignore
                        id: entity._id,
                        // description: `(${entity._id})`,
                        label: entity._fileUri.path.name,
                        detail: workspaceRootUri.path.relative(entity._fileUri.path)?.fsPath(),
                    });
                }
            }
        });
    }

    return quickPickService.show(items, quickPickOptions);
};
