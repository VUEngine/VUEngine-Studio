import { nls } from '@theia/core';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
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
}

export default function ImageConvEditor(props: ImageConvEditorProps): React.JSX.Element {
    const { data, updateData } = props;

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
                <VContainer gap={20} overflow='hidden'>
                    <General />
                    <HContainer gap={20} alignItems='start' wrap='wrap'>
                        <Tiles />
                        <Map />
                        <Animation />
                    </HContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/imageConvEditor/xFiles', 'Image Files ({0})', data.files.length)}
                        </label>
                        {data.files.length === 0 &&
                            <div style={{ fontStyle: 'italic' }}>
                                <i className='codicon codicon-info' style={{ verticalAlign: 'bottom' }} />{' '}
                                {nls.localize(
                                    'vuengine/imageConvEditor/noFilesSelected',
                                    'No images selected. All images in this folder will be converted.'
                                )}
                            </div>
                        }
                        <Images
                            data={data.files}
                            updateData={updateFiles}
                            allInFolderAsFallback={true}
                            canSelectMany={true}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/imageConvEditor/xFiles', 'Image Files ({0})', data.files.length)}
                        </label>
                        {data.files.length === 0 &&
                            <div style={{ fontStyle: 'italic' }}>
                                <i className='codicon codicon-info' style={{ verticalAlign: 'bottom' }} />{' '}
                                {nls.localize(
                                    'vuengine/imageConvEditor/noFilesSelected',
                                    'No images selected. All images in this folder will be converted.'
                                )}
                            </div>
                        }
                        <Images
                            data={data.files}
                            updateData={updateFiles}
                            allInFolderAsFallback={true}
                            canSelectMany={true}
                        />
                    </VContainer>
                </VContainer>
            </ImageConvEditorContext.Provider>
        </div>
    );
}
