import { createContext } from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';

// @ts-ignore
export const ImageEditorContext = createContext<ImageEditorContextType>({});

export interface ImageEditorContextType {
    imageData: ImageConfig
    updateImageData: (data: Partial<ImageConfig>) => void
}
