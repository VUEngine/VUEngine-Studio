import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import { ISizeCalculationResult } from 'image-size/dist/types/interface';

// @ts-ignore
export const ImageConvEditorContext = React.createContext<ImageConvEditorContextType>({});

export interface ImageConvEditorContextType {
    filesToShow: { [path: string]: ISizeCalculationResult }
    setFilesToShow: (filesToShow: { [path: string]: ISizeCalculationResult }) => void
    imageConvData: ImageConfig
    setImageConvData: (songData: Partial<ImageConfig>) => void
}

export const ImageConvEditorLayoutStorageName = 'ves-editors-ImageConvEditor-layout';

