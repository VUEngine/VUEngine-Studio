import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

export default function TilesMap(): React.JSX.Element {
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

    const toggleGenerateMap = () => {
        setImageConvData({
            map: {
                ...imageConvData.map,
                generate: !imageConvData.map.generate
            },
        });
    };

    const toggleReduceFlipped = () => {
        setImageConvData({
            map: {
                ...imageConvData.map,
                reduce: {
                    ...imageConvData.map.reduce,
                    flipped: !imageConvData.map.reduce.flipped
                }
            },
        });
    };

    const toggleReduceUnique = () => {
        setImageConvData({
            map: {
                ...imageConvData.map,
                reduce: {
                    ...imageConvData.map.reduce,
                    unique: !imageConvData.map.reduce.unique
                }
            },
        });
    };

    return <VContainer gap={10}>
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
                {nls.localize('vuengine/imageConvEditor/shareTiles', 'All maps should share a single tileset')}
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
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/map', 'Map')}
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={imageConvData.map.generate}
                    onChange={toggleGenerateMap}
                />
                {nls.localize('vuengine/imageConvEditor/generateMap', 'Generate map data')}
            </label>
            {
                imageConvData.map.generate && <>
                    <label>
                        <input
                            type="checkbox"
                            checked={imageConvData.map.reduce.flipped}
                            onChange={toggleReduceFlipped}
                        />
                        {nls.localize('vuengine/imageConvEditor/optimizeFlippedTiles', 'Optimize flipped tiles')}
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={imageConvData.map.reduce.unique}
                            onChange={toggleReduceUnique}
                        />
                        {nls.localize('vuengine/imageConvEditor/optimizeUniqueTiles', 'Optimize unique tiles')}
                    </label>
                </>
            }
        </VContainer>
    </VContainer>;
}
