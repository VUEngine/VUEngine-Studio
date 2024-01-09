import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { DataSection } from '../../Common/CommonTypes';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import { ImageEditorContext, ImageEditorContextType } from '../ImageEditorTypes';

export default function General(): React.JSX.Element {
    const { imageData, updateImageData } = useContext(ImageEditorContext) as ImageEditorContextType;

    const setName = (n: string): void => {
        updateImageData({ name: n });
    };

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
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/imageEditor/name', 'Name')}
                </label>
                <input
                    className='theia-input large'
                    value={imageData.name}
                    onChange={e => setName(e.target.value)}
                />
            </VContainer>
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
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/entityEditor/section', 'Section')}
                    tooltip={nls.localize(
                        'vuengine/entityEditor/sectionDescription',
                        'Defines whether image data should be stored in ROM space or Expansion space. ' +
                        'You usually want to leave this untouched, since the latter only works on specially designed cartridges.'
                    )}
                    tooltipPosition='bottom'
                />
                <RadioSelect
                    defaultValue={imageData.section}
                    options={[{
                        label: 'ROM',
                        value: DataSection.ROM,
                    }, {
                        label: nls.localize('vuengine/entityEditor/expansion', 'Expansion'),
                        value: DataSection.EXP,
                    }]}
                    onChange={options => setSection(options[0].value as DataSection)}
                />
            </VContainer>
        </HContainer>
    </VContainer>;
}
