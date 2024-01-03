import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

export default function Tiles(): React.JSX.Element {
    const { imageConvData, updateImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;

    const toggleShareTiles = () => {
        updateImageConvData({
            tileset: {
                ...imageConvData.tileset,
                shared: !imageConvData.tileset.shared
            },
        });
    };

    return <VContainer gap={15}>
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
    </VContainer>;
}
