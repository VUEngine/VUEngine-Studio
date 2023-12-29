import { URI } from '@theia/core';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import { EditorsServices } from '../../ves-editors-widget';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import Animation from './Animation/Animation';
import General from './General/General';
import { ImageConvEditorContext } from './ImageConvEditorTypes';
import Images from './Images/Images';
import Map from './TilesMap/Map';
import Tiles from './TilesMap/Tiles';

interface ImageConvEditorProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    services: EditorsServices
}

export default function ImageConvEditor(props: ImageConvEditorProps): React.JSX.Element {
    const {
        data,
        updateData,
        fileUri,
        services,
    } = props;

    const updateImageConvData = (updatedData: Partial<ImageConfig>): void => {
        updateData({ ...data, ...updatedData });
    };

    const updateFiles = (files: string[]): void => {
        updateData({ ...data, files });
    };

    return (
        <div className="imageConvEditor">
            <ImageConvEditorContext.Provider
                value={{
                    imageConvData: data,
                    updateImageConvData,
                }}
            >
                <VContainer gap={20}>
                    <General />
                    <HContainer gap={20} alignItems='start' wrap='wrap'>
                        <Tiles />
                        <Map />
                        <Animation />
                    </HContainer>
                    <Images
                        data={data.files}
                        updateData={updateFiles}
                        allInFolderAsFallback={true}
                        canSelectMany={true}
                        fileUri={fileUri}
                        services={services}
                    />
                </VContainer>
            </ImageConvEditorContext.Provider>
        </div>
    );
}
