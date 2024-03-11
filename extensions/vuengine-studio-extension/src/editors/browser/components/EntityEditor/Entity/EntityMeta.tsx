import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function EntityMeta(): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    const getTileCount = (): number => {
        let totalTiles = 0;
        data.components?.sprites?.map(s => {
            if (s._imageData !== undefined && typeof s._imageData !== 'number') {
                if (s._imageData.animation?.largestFrame) {
                    totalTiles += s._imageData.animation?.largestFrame;
                } else {
                    if (s._imageData.tiles?.count) {
                        totalTiles += data.components?.animations?.length > 0 && !data.animations.multiframe
                            ? s._imageData.tiles?.count / data.animations?.totalFrames || 1
                            : s._imageData.tiles?.count;
                    }
                }
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
