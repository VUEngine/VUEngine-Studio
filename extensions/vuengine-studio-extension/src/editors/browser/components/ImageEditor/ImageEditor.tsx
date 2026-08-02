import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { ImageConfig, ImageDataMap } from '../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import Animation from './Animation';
import DataOptions from './DataOptions';
import { conversionKey, ImageEditorContext, isSingleConvertedFile } from './ImageEditorTypes';
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
    const { fileUri, isGenerating, setIsGenerating, setGeneratingProgress, services } = useContext(EditorsContext) as EditorsContextType;

    const convertImages = async (config: ImageConfig): Promise<ImageDataMap> => {
        const name = fileUri.path.name;

        if (isSingleConvertedFile(config)) {
            const result = await services.vesImagesService.convertImage(fileUri, { ...config, name });
            return { [name]: await services.vesImagesService.compressImageData(result) };
        }

        let converted = 0;
        const imageData: ImageDataMap = {};
        await Promise.all(config.files.map(async file => {
            const result = await services.vesImagesService.convertImage(fileUri, { ...config, name }, file);
            imageData[fileUri.parent.resolve(file).path.name] = await services.vesImagesService.compressImageData(result);
            setGeneratingProgress(++converted, config.files.length);
        }));

        return imageData;
    };

    const convertAndUpdate = async (config: ImageConfig): Promise<void> => {
        setIsGenerating(true);
        try {
            updateData({ ...config, _imageData: await convertImages(config) });
        } finally {
            setIsGenerating(false);
        }
    };

    const updateImageData = (updatedData: Partial<ImageConfig>): void => {
        if (isGenerating) {
            return;
        }

        const newData = { ...data, ...updatedData };
        if (conversionKey(newData) === conversionKey(data)) {
            updateData(newData);
            return;
        }

        convertAndUpdate(newData);
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
                    reconvertImages: () => convertAndUpdate(data),
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
                        <Images
                            data={data.files}
                            updateData={updateFiles}
                            alwaysShowAddButton={true}
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
