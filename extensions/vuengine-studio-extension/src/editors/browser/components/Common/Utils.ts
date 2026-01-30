import { MessageService, QuickPickItem, QuickPickOptions, QuickPickService, deepClone, isNumber, nls } from '@theia/core';
import { EolStyle, Formatter, FracturedJsonOptions, NumberListAlignment } from 'fracturedjsonjs';
import { customAlphabet } from 'nanoid';
import { VesProjectService } from '../../../../project/browser/ves-project-service';
import { WithContributor, WithFileUri, WithId } from '../../../../project/browser/ves-project-types';

export const clamp = (value: number, min: number, max: number, deflt: number = 0): number =>
    isNumber(value)
        ? Math.min(Math.max(value, min), max)
        : deflt;

export const showItemSelection = async (
    type: string,
    quickPickService: QuickPickService,
    messageService: MessageService,
    vesProjectService: VesProjectService,
    ignoreIds?: string[]
): Promise<QuickPickItem | undefined> => {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
        title: nls.localize('vuengine/editors/general/selectItem', 'Select Item'),
        placeholder: nls.localize('vuengine/editors/general/selectItemOfTypeToAdd', 'Select item of type {0} to add...', type),
    };
    const quickPickItems: QuickPickItem[] = [];
    const projectItems = vesProjectService.getProjectDataItemsForType(type);
    if (projectItems === undefined || Object.keys(projectItems).length === 0) {
        messageService.error(
            nls.localize('vuengine/editors/general/noItemsOfTypeFound', 'No items of type {0} found.', type)
        );
        return;
    }
    Object.keys(projectItems).map(k => {
        if (!ignoreIds || !ignoreIds.includes(k)) {
            const item = projectItems[k] as unknown & WithContributor & WithFileUri & WithId;
            if (item._id) {
                quickPickItems.push({
                    id: item._id,
                    // description: `(${item._id})`,
                    label: item._fileUri.path.name,
                    detail: item._contributorUri.parent.path.relative(item._fileUri.path)?.fsPath(),
                });
            }
        }
    });

    return quickPickService.show(quickPickItems, quickPickOptions);
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
export const roundToNextMultipleOf16 = (x: number) => (x + 15) & (-16);

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

export const nanoid = () =>
    customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16)();

export const stringify = (input: any) => {
    const options = new FracturedJsonOptions();
    options.AllowTrailingCommas = false;
    options.CommaPadding = false;
    options.JsonEolStyle = EolStyle.Lf;
    options.MaxCompactArrayComplexity = 1;
    options.MaxInlineComplexity = 0;
    options.MaxInlineLength = Number.MAX_SAFE_INTEGER;
    options.MaxTableRowComplexity = -1;
    options.MaxTotalLineLength = Number.MAX_SAFE_INTEGER;
    options.MinCompactArrayRowItems = 1;
    options.NumberListAlignment = NumberListAlignment.Left;
    options.OmitTrailingWhitespace = true;
    options.UseTabToIndent = true;

    const formatter = new Formatter();
    formatter.Options = options;

    return (formatter.Serialize(input) ?? '')
        .replace(/(\s+),/g, ',');
};

export const arrayMove = (arr: any[], oldIndex: number, newIndex: number) => {
    const result = deepClone(arr);
    if (newIndex >= result.length) {
        let k = newIndex - result.length + 1;
        while (k--) {
            result.push(undefined);
        }
    }
    result.splice(newIndex, 0, result.splice(oldIndex, 1)[0]);
    return result;
};

export const trimBits = (int: number, length: number) =>
    int & ((1 << length) - 1);

export const intToHex = (value: number, length?: number) => {
    // catch null
    if (!value) {
        value = 0;
    }
    return value.toString(16).toUpperCase().padStart(
        length === 8 ? 10 : length === 2 ? 4 : 6,
        length === 8 ? '0x00000000' : length === 2 ? '0x00' : '0x0000'
    );
};

export const hexFromBitsArray = (bitsArray: (number | undefined)[][]): string => {
    let sum = 0;
    let totalBits = 0;
    if (bitsArray.length) {
        bitsArray.reverse().forEach(b => {
            if (b[0] !== undefined) {
                sum += trimBits(b[0], b[1]!) * Math.pow(2, totalBits);
            }
            totalBits += b[1]!;
        });
    }

    return intToHex(sum, totalBits / 4);
};

export const sortObjectByKeys = (unordered: object) =>
    Object.keys(unordered)
        .sort()
        .reduce((ordered, key) => {
            // @ts-ignore
            ordered[key] = unordered[key];
            return ordered;
        }, {});

export const scaleCanvasAccountForDpi = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, width: number, height: number) => {
    const dpr = window.devicePixelRatio ?? 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    context.scale(dpr, dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
};
