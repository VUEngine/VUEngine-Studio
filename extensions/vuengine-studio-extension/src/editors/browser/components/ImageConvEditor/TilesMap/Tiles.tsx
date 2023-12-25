import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

export default function Tiles(): React.JSX.Element {
    const { imageConvData, setImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;

    const toggleShareTiles = () => {
        setImageConvData({
            tileset: {
                ...imageConvData.tileset,
                shared: !imageConvData.tileset.shared
            },
        });
    };

    const setTilesCompression = (compression: ImageCompressionType) => {
        setImageConvData({
            tileset: {
                ...imageConvData.tileset,
                compression
            },
        });
    };

    return <VContainer gap={20}>
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/tiles', 'Tiles')}
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={imageConvData.tileset.shared}
                    onChange={toggleShareTiles}
                />
                {nls.localize('vuengine/imageConvEditor/shareTiles', 'Maps should share a tileset')}
            </label>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/tilesCompression', 'Tiles Compression')}
            </label>
            <SelectComponent
                defaultValue={imageConvData.tileset.compression}
                options={[{
                    label: nls.localize('vuengine/imageConvEditor/compression/none', 'None'),
                    value: ImageCompressionType.NONE,
                    description: nls.localize('vuengine/imageConvEditor/compression/offDescription', 'Do not compress tiles data'),
                }, {
                    label: nls.localize('vuengine/imageConvEditor/compression/rle', 'RLE'),
                    value: ImageCompressionType.RLE,
                    description: nls.localize('vuengine/imageConvEditor/compression/rleDescription', 'Compress tiles data with RLE'),
                }]}
                onChange={option => setTilesCompression(option.value as ImageCompressionType)}
            />
        </VContainer>
    </VContainer>;
}
