import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, SpriteImageData } from '../EntityEditorTypes';

export default function EntityMeta(): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    const getTileCount = (): number => {
        let totalTiles = 0;
        data.components?.sprites?.map(s => {
            if (s._imageData !== undefined && typeof s._imageData !== 'number' && s._imageData.images?.length) {
                [0, 1].map(i => {
                    const imageData = s._imageData as SpriteImageData;
                    if (imageData.images[i] !== undefined) {
                        const images = imageData.images[i];
                        if (images.animation?.largestFrame) {
                            totalTiles += images.animation?.largestFrame ?? 0;
                        } else {
                            if (images.tiles?.count) {
                                totalTiles += data.components?.animations?.length > 0 && !data.animations.multiframe
                                    ? images.tiles?.count / data.animations?.totalFrames ?? 1
                                    : images.tiles?.count;
                            }
                        }
                    }
                });
            }
        });

        return totalTiles;
    };

    const tileCount = getTileCount();

    return <>
        {tileCount > 0 &&
            <VContainer gap={15}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/tiles', 'Tiles')}
                    </label>
                    <input
                        className={`theia-input heaviness ${tileCount > 1200 ? 'heavinessHeavy' : tileCount > 600 ? 'heavinessMedium' : 'heavinessLight'}`}
                        type='text'
                        value={tileCount}
                        disabled
                    />
                </VContainer>
            </VContainer>
        }
    </>;
}
