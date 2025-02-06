import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../Common/Base/VContainer';
import { ImageEditorContext, ImageEditorContextType } from './ImageEditorTypes';

export default function Map(): React.JSX.Element {
    const { imageData, updateImageData } = useContext(ImageEditorContext) as ImageEditorContextType;

    const toggleGenerateMap = () => {
        updateImageData({
            map: {
                ...imageData.map,
                generate: !imageData.map.generate
            },
        });
    };

    const toggleReduceFlipped = () => {
        updateImageData({
            map: {
                ...imageData.map,
                reduce: {
                    ...imageData.map.reduce,
                    flipped: !imageData.map.reduce.flipped
                }
            },
        });
    };

    const toggleReduceUnique = () => {
        updateImageData({
            map: {
                ...imageData.map,
                reduce: {
                    ...imageData.map.reduce,
                    unique: !imageData.map.reduce.unique
                }
            },
        });
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/editors/image/map', 'Map')}
        </label>
        <label>
            <input
                type="checkbox"
                checked={imageData.map.generate}
                onChange={toggleGenerateMap}
            />
            {nls.localize('vuengine/editors/image/generateMap', 'Generate map data')}
        </label>
        {
            imageData.map.generate && <>
                <label>
                    <input
                        type="checkbox"
                        checked={imageData.map.reduce.flipped}
                        onChange={toggleReduceFlipped}
                    />
                    {nls.localize('vuengine/editors/image/optimizeFlippedTiles', 'Optimize flipped tiles')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={imageData.map.reduce.unique}
                        onChange={toggleReduceUnique}
                    />
                    {nls.localize('vuengine/editors/image/optimizeUniqueTiles', 'Optimize unique tiles')}
                </label>
            </>
        }
    </VContainer>;
}
