import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { DataSection } from '../Common/CommonTypes';
import HContainer from '../Common/Base/HContainer';
import InfoLabel from '../Common/InfoLabel';
import RadioSelect from '../Common/Base/RadioSelect';
import SectionSelect from '../Common/SectionSelect';
import VContainer from '../Common/Base/VContainer';
import { ImageEditorContext, ImageEditorContextType } from './ImageEditorTypes';

export default function DataOptions(): React.JSX.Element {
    const { imageData, updateImageData } = useContext(ImageEditorContext) as ImageEditorContextType;

    const setTilesCompression = (compression: ImageCompressionType) => {
        updateImageData({
            tileset: {
                ...imageData.tileset,
                compression
            },
        });
    };

    const setSection = (section: DataSection) => {
        updateImageData({
            section,
        });
    };

    return <VContainer gap={15}>
        <HContainer gap={10} wrap='wrap'>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/compression', 'Compression')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/compressionDescription',
                        // eslint-disable-next-line max-len
                        'Image data can be stored in a compressed format to save ROM space. Comes at the cost of a slightly higher CPU load when loading data into memory.'
                    )}
                    tooltipPosition='bottom'
                />
                <RadioSelect
                    options={[{
                        label: nls.localize('vuengine/entityEditor/none', 'None'),
                        value: ImageCompressionType.NONE,
                    }, {
                        label: nls.localize('vuengine/entityEditor/rle', 'RLE'),
                        value: ImageCompressionType.RLE,
                    }]}
                    defaultValue={imageData.tileset.compression}
                    onChange={options => setTilesCompression(options[0].value as ImageCompressionType)}
                />
            </VContainer>
            <SectionSelect
                value={imageData.section}
                setValue={setSection}
            />
        </HContainer>
    </VContainer>;
}
