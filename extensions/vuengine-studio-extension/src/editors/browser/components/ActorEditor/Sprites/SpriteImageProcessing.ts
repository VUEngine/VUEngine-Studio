import { isNumber } from '@theia/core';
import { useContext, useEffect, useState } from 'react';
import { MAX_IMAGE_WIDTH } from 'vb-image-converter';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { clamp, roundToNextMultipleOf8 } from '../../Common/Utils';
import { SpriteType } from '../../Common/VUEngineTypes';
import { ActorEditorSaveDataOptions } from '../ActorEditor';
import { ActorData, SpriteData } from '../ActorEditorTypes';
import { ImageProcessingSettingsFormProps } from './ImageProcessingSettingsForm';

export interface SpriteImageMetaData {
    filename: string
    width: number
    height: number
    widthPadded: number
    heightPadded: number
}

export interface SpriteImageMetaDataPair {
    left: SpriteImageMetaData
    right: SpriteImageMetaData
}

const EMPTY_IMAGE_META_DATA: SpriteImageMetaData = {
    filename: '',
    width: 0,
    height: 0,
    widthPadded: 0,
    heightPadded: 0,
};

export const EMPTY_SPRITE_IMAGE_META_DATA: SpriteImageMetaDataPair = {
    left: EMPTY_IMAGE_META_DATA,
    right: EMPTY_IMAGE_META_DATA,
};

export function useSpriteImageMetaData(sprite: SpriteData | undefined): SpriteImageMetaDataPair {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    const [metaData, setMetaData] = useState<SpriteImageMetaDataPair>(EMPTY_SPRITE_IMAGE_META_DATA);

    const files = sprite?.texture?.files ?? [];
    const files2 = sprite?.texture?.files2 ?? [];
    const filesKey = files.join('|');
    const files2Key = files2.join('|');

    useEffect(() => {
        let cancelled = false;

        const read = async (f: string[]): Promise<SpriteImageMetaData> => {
            if (!f.length) {
                return EMPTY_IMAGE_META_DATA;
            }

            const resolvedUri = fileUri.parent.resolve(f[0]);
            const exists = await services.fileService.exists(resolvedUri);
            const dimensions = exists
                ? window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath())
                : undefined;
            const width = dimensions?.width ?? 0;
            const height = dimensions?.height ?? 0;

            return {
                filename: f.length > 1
                    ? `${resolvedUri.path.base} +${f.length - 1}`
                    : resolvedUri.path.base,
                width,
                height,
                widthPadded: clamp(roundToNextMultipleOf8(width), 0, MAX_IMAGE_WIDTH),
                heightPadded: roundToNextMultipleOf8(height),
            };
        };

        const run = async (): Promise<void> => {
            const [left, right] = await Promise.all([read(files), read(files2)]);
            // A newer run can finish first, so drop the result of a superseded one.
            if (!cancelled) {
                setMetaData({ left, right });
            }
        };
        run();

        return () => {
            cancelled = true;
        };
    }, [filesKey, files2Key, fileUri]);

    return metaData;
}

export const isSpriteAnimated = (data: ActorData, sprite: SpriteData): boolean =>
    !!sprite.isAnimated && data.components?.animations?.length > 0;

export const isFrameBlendModeAllowed = (
    data: ActorData,
    sprite: SpriteData,
    imageHeightPadded: number,
): boolean =>
    data.sprites.type === SpriteType.Bgmap &&
    // No HiColor support for animated sprites
    !isSpriteAnimated(data, sprite) &&
    // No HiColor support for repeated sprites
    !sprite.texture?.repeat?.x &&
    !sprite.texture?.repeat?.y &&
    // FrameBlend sprites are stored in a single map, aligned top/down. Therefore, they can't be higher than 256 px.
    imageHeightPadded <= 256;

export function buildImageProcessingSettingsFormProps(
    data: ActorData,
    sprite: SpriteData,
    updateSprite: (partialData: Partial<SpriteData>, options?: ActorEditorSaveDataOptions) => void,
    imageHeightPadded: number,
): ImageProcessingSettingsFormProps {
    const allowFrameBlendMode = isFrameBlendModeAllowed(data, sprite, imageHeightPadded);

    return {
        image: sprite.texture?.files[0],
        setFiles: files => updateSprite({
            name: files.length ? files[0].split('/').pop()?.split('.')[0] : undefined,
            texture: {
                ...sprite.texture,
                files,
            },
        }, {
            appendImageData: true,
        }),
        imageData: !isNumber(sprite._imageData) ? sprite._imageData?.images[0] : undefined,
        processingSettings: sprite.imageProcessingSettings,
        updateProcessingSettings: partialImageProcessingSettings => updateSprite({
            imageProcessingSettings: {
                ...sprite.imageProcessingSettings,
                ...partialImageProcessingSettings,
            },
        }, {
            appendImageData: true,
        }),
        colorMode: allowFrameBlendMode ? sprite.colorMode : ColorMode.Default,
        updateColorMode: colorMode => updateSprite({
            colorMode,
        }, {
            appendImageData: true,
        }),
        allowFrameBlendMode,
        compression: sprite.compression,
        maxTiles: sprite.maxTiles ?? 0,
        updateMaxTiles: maxTiles => updateSprite({
            maxTiles,
        }, {
            appendImageData: true,
        }),
        convertImage: () => updateSprite({}, {
            appendImageData: true,
        }),
    };
}
