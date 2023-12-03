import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';

// @ts-ignore
export const ImageConvEditorContext = React.createContext<ImageConvEditorContextType>({});

export interface ImageConvEditorContextType {
    state: ImageConvEditorState
    setState: (state: Partial<ImageConvEditorState>) => void
    imageConvData: ImageConfig
    setImageConvData: (songData: Partial<ImageConfig>) => void
}

export const ImageConvEditorLayoutStorageName = 'ves-editors-ImageConvEditor-layout';

export interface ImageConvEditorState {
    preview: {
        animations: boolean
        palette: string
        zoom: number
    }
}
