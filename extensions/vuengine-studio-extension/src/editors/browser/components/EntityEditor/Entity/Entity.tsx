import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function Entity(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const getCharCount = (): number => {
        let totalChars = 0;
        data.sprites?.sprites?.map(s => {
            if (s._imageData !== undefined && typeof s._imageData !== 'number') {
                if (s._imageData.animation?.largestFrame) {
                    totalChars += s._imageData.animation?.largestFrame;
                } else {
                    if (s._imageData.tiles?.count) {
                        totalChars += data.animations?.animations?.length > 0 && !data.animations.multiframe
                            ? s._imageData.tiles?.count / data.animations?.totalFrames || 1
                            : s._imageData.tiles?.count;
                    }
                }
            }
        });

        return totalChars;
    };

    const charCount = getCharCount();

    const setName = (n: string): void => {
        setData({ name: n });
    };

    return <HContainer gap={15} alignItems='start'>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/name', 'Name')}
            </label>
            <input
                className='theia-input'
                value={data.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
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
    </HContainer>;
}
