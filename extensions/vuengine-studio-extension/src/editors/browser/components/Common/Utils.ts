import { QuickPickItem, QuickPickOptions, QuickPickService, isNumber, nls } from '@theia/core';
import { VesProjectService } from '../../../../project/browser/ves-project-service';

export const clamp = (value: number, min: number, max: number, deflt: number = 0): number =>
    isNumber(value)
        ? Math.min(Math.max(value, min), max)
        : deflt;

export const showActorSelection = async (
    quickPickService: QuickPickService,
    vesProjectService: VesProjectService,
    ignoreIds?: string[]
): Promise<QuickPickItem | undefined> => {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
        title: nls.localize('vuengine/editors/selectActor', 'Select Actor'),
        placeholder: nls.localize('vuengine/editors/selectActorToAdd', 'Select an Actor to add...'),
    };
    const items: QuickPickItem[] = [];
    const actors = vesProjectService.getProjectDataItemsForType('Actor');
    if (actors) {
        Object.keys(actors).map(k => {
            if (!ignoreIds || !ignoreIds.includes(k)) {
                const actor = actors[k];
                // @ts-ignore
                if (actor._id) {
                    items.push({
                        // @ts-ignore
                        id: actor._id,
                        // description: `(${actor._id})`,
                        label: actor._fileUri.path.name,
                        detail: actor._contributorUri.parent.path.relative(actor._fileUri.path)?.fsPath(),
                    });
                }
            }
        });
    }

    return quickPickService.show(items, quickPickOptions);
};

export const getMaxScaleInContainer = (containerWidth: number, containerHeight: number, width: number, height: number, integerScale = false) => {
    let heightScale = 0;
    if (containerHeight && height) {
        heightScale = integerScale ? Math.floor(containerHeight / height) : containerHeight / height;
    }

    let widthScale = 0;
    if (containerWidth && width) {
        widthScale = integerScale ? Math.floor(containerWidth / width) : containerWidth / width;
    }

    return heightScale || widthScale
        ? Math.min(heightScale, widthScale)
        : 1;
};

export const roundToNextMultipleOf4 = (x: number) => (x + 3) & (-4);
export const roundToNextMultipleOf8 = (x: number) => (x + 7) & (-8);

export const toUpperSnakeCase = (key: string): string => {
    const splitCaps = (input: string) => input
        ? input
            .replace(/([a-z])([A-Z]+)/g, (m, s1, s2) => s1 + ' ' + s2)
            .replace(/([A-Z])([A-Z]+)([^a-zA-Z0-9]*)$/, (m, s1, s2, s3) => s1 + s2.toLowerCase() + s3)
            .replace(/([A-Z]+)([A-Z][a-z])/g, (m, s1, s2) => s1.toLowerCase() + ' ' + s2)
        : '';

    return splitCaps(key)
        .replace(/\W+/g, ' ')
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join('_')
        .toUpperCase()
        .replace('VU_ENGINE', 'VUENGINE'); // meh...
};
