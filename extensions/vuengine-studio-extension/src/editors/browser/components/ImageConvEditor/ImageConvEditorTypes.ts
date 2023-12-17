import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';

// @ts-ignore
export const ImageConvEditorContext = React.createContext<ImageConvEditorContextType>({});

export interface ImageConvEditorContextType {
    filesToShow: { [path: string]: string }
    setFilesToShow: (filesToShow: { [path: string]: string }) => void
    imageConvData: ImageConfig
    setImageConvData: (songData: Partial<ImageConfig>) => void
}
