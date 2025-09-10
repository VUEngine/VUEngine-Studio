import { nls } from '@theia/core';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import Animation from './Animation';
import DataOptions from './DataOptions';
import { ImageEditorContext } from './ImageEditorTypes';
import Images from './Images';
import Map from './Map';
import Quantisation from './Quantisation';
import Tiles from './Tiles';

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
                    <HContainer gap={20} alignItems='start' wrap='wrap'>
                        <Tiles />
                        <Map />
                        <Animation />
                        <DataOptions />
                        <Quantisation />
                    </HContainer>
                    <VContainer overflow='hidden'>
                        <label>
                            {nls.localize('vuengine/editors/image/files', 'Image Files')}
                            {' '}<span className='count'>{data.files.length}</span>
                        </label>
                        {data.files.length === 0 &&
                            <div style={{ fontStyle: 'italic' }}>
                                <i className='codicon codicon-info' style={{ verticalAlign: 'bottom' }} />{' '}
                                {nls.localize(
                                    'vuengine/editors/image/noFilesSelected',
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
