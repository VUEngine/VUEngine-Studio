import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function EntityMeta(): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    const getCharCount = (): number => {
        let totalChars = 0;
        data.components?.sprites?.map(s => {
            if (s._imageData !== undefined && typeof s._imageData !== 'number') {
                if (s._imageData.animation?.largestFrame) {
                    totalChars += s._imageData.animation?.largestFrame;
                } else {
                    if (s._imageData.tiles?.count) {
                        totalChars += data.components?.animations?.length > 0 && !data.animations.multiframe
                            ? s._imageData.tiles?.count / data.animations?.totalFrames || 1
                            : s._imageData.tiles?.count;
                    }
                }
            }
        });

        return totalChars;
    };

    const charCount = getCharCount();

    return <VContainer gap={15}>
        {charCount > 0 &&
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/chars', 'Chars')}
                </label>
                <input
                    className={`theia-input heaviness ${charCount > 1200 ? 'heavinessHeavy' : charCount > 600 ? 'heavinessMedium' : 'heavinessLight'}`}
                    type='text'
                    value={charCount}
                    disabled
                />
            </VContainer>
        }
    </VContainer>;
}