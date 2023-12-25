import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

export default function Map(): React.JSX.Element {
    const { imageConvData, setImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;

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

    return <VContainer>
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
    </VContainer>;
}
