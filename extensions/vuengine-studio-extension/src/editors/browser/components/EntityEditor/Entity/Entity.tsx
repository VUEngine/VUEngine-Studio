import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import ComponentsTree from './ComponentsTree';
import { Tree } from 'react-arborist';

export default function Entity(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

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

    const setName = (n: string): void => {
        setData({ name: n });
    };

    return <VContainer gap={15}>
        <HContainer gap={15} alignItems='start'>
            <VContainer grow={1}>
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
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/components', 'Components')}
            </label>
            <ComponentsTree />
            <input
                className='theia-input'
                type='text'
                placeholder='Search...'
            />
            <Tree
                initialData={[
                    { id: '1', name: 'Unread' },
                    {
                        id: '2', name: 'Threads',
                        children: [],
                    },
                    {
                        id: '3',
                        name: 'Chat Rooms',
                        children: [
                            { id: 'c1', name: 'General' },
                            { id: 'c2', name: 'Random' },
                            { id: 'c3', name: 'Open Source Projects' },
                        ],
                    },
                    {
                        id: '4',
                        name: 'Direct Messages',
                        children: [
                            { id: 'd1', name: 'Alice' },
                            { id: 'd2', name: 'Bob' },
                            { id: 'd3', name: 'Charlie' },
                        ],
                    },
                ]}
                indent={24}
                rowHeight={24}
                openByDefault={false}
                width='100%'
            />
        </VContainer>
    </VContainer>;
}
