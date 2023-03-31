import { nls } from '@theia/core';
import React from 'react';

export default function PianoRollHeader(): JSX.Element {
    return <div className='pianoRollHeader'>
        <div
            className='pianoRollHeaderTitle'
            title={`${nls.localize('vuengine/musicEditor/channel', 'Channel')} / ${nls.localize('vuengine/musicEditor/pattern', 'Pattern')}`}
        >
            -
        </div>
        <div className='pianoRollHeaderAttributes'>

        </div>
    </div>;
}
