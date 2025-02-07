import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/Base/VContainer';
import { ActorEditorContext, ActorEditorContextType, SpriteImageData } from '../ActorEditorTypes';

export default function ActorMeta(): React.JSX.Element {
    const { data } = useContext(ActorEditorContext) as ActorEditorContextType;

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
                                    ? images.tiles?.count / (data.animations?.totalFrames ?? 1)
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
            <VContainer
                gap={15}
                style={{
                    overflow: 'visible',
                    padding: 'var(--padding) var(--padding) 0',
                    zIndex: 1,
                }}
            >
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/tiles', 'Tiles')}
                    </label>
                    <div>
                        <input
                            className={`theia-input heaviness ${tileCount > 1200 ? 'heavinessHeavy' : tileCount > 600 ? 'heavinessMedium' : 'heavinessLight'}`}
                            type='text'
                            value={tileCount}
                            disabled
                        />
                    </div>
                </VContainer>
            </VContainer>
        }
    </>;
}
