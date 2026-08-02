import { createContext } from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';

// Everything a conversion depends on. Changes to anything else, e.g. the memory
// section, do not invalidate the stored image data.
export const conversionKey = (config: ImageConfig): string => JSON.stringify([
    config.files,
    config.tileset,
    config.map,
    config.animation,
    config.imageProcessingSettings,
    config.colorMode,
]);

// Individual file animations and shared tilesets are emitted as a single converted
// file, every other config gets one converted file per image.
export const isSingleConvertedFile = (config: ImageConfig): boolean =>
    config.tileset.shared || (config.animation.isAnimation && config.animation.individualFiles);

// @ts-ignore
export const ImageEditorContext = createContext<ImageEditorContextType>({});

export interface ImageEditorContextType {
    imageData: ImageConfig
    updateImageData: (data: Partial<ImageConfig>) => void
    reconvertImages: () => void
}
