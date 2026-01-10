import { nls } from '@theia/core';
import React, { useContext } from 'react';
import Checkbox from '../Common/Base/Checkbox';
import VContainer from '../Common/Base/VContainer';
import { ImageEditorContext, ImageEditorContextType } from './ImageEditorTypes';

export default function Tiles(): React.JSX.Element {
    const { imageData, updateImageData } = useContext(ImageEditorContext) as ImageEditorContextType;

    const toggleShareTiles = () => {
        updateImageData({
            tileset: {
                ...imageData.tileset,
                shared: !imageData.tileset.shared
            },
        });
    };

    return <VContainer gap={15}>
        <Checkbox
            label={nls.localize('vuengine/editors/image/tiles', 'Tiles')}
            sideLabel={nls.localize('vuengine/editors/image/shareTiles', 'Maps should share a tileset')}
            checked={imageData.tileset.shared}
            setChecked={toggleShareTiles}
        />
    </VContainer>;
}
