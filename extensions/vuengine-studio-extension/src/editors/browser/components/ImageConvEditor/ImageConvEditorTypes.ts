import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';

// @ts-ignore
export const ImageConvEditorContext = React.createContext<ImageConvEditorContextType>({});

export interface ImageConvEditorContextType {
    imageConvData: ImageConfig
    updateImageConvData: (data: Partial<ImageConfig>) => void
}
