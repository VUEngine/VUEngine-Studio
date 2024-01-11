import { nls } from '@theia/core';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import Animation from './Animation/Animation';
import General from './General/General';
import { ImageEditorContext } from './ImageEditorTypes';
import Images from './Images/Images';
import Map from './TilesMap/Map';
import Tiles from './TilesMap/Tiles';

interface ImageEditorProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
}

export default function ImageEditor(props: ImageEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    const updateImageData = (updatedData: Partial<ImageConfig>): void => {
        updateData({ ...data, ...updatedData });
    };

    const updateFiles = (files: string[]): void => {
        updateImageData({ files });
    };

    return (
        <div className="imageEditor">
            <ImageEditorContext.Provider
                value={{
                    imageData: data,
                    updateImageData: updateImageData,
                }}
            >
                <VContainer gap={20} overflow='hidden'>
                    <General />
                    <HContainer gap={20} alignItems='start' wrap='wrap'>
                        <Tiles />
                        <Map />
                        <Animation />
                    </HContainer>
                    <VContainer overflow='hidden'>
                        <label>
                            {nls.localize('vuengine/imageEditor/files', 'Image Files')}
                            {' '}<span className='count'>{data.files.length}</span>
                        </label>
                        {data.files.length === 0 &&
                            <div style={{ fontStyle: 'italic' }}>
                                <i className='codicon codicon-info' style={{ verticalAlign: 'bottom' }} />{' '}
                                {nls.localize(
                                    'vuengine/imageEditor/noFilesSelected',
                                    'No images selected. All images in this folder will be converted.'
                                )}
                            </div>
                        }
                        <Images
                            data={data.files}
                            updateData={updateFiles}
                            allInFolderAsFallback={true}
                            canSelectMany={true}
                            stack={false}
                            showMetaData={true}
                        />
                    </VContainer>
                </VContainer>
            </ImageEditorContext.Provider>
        </div>
    );
}
