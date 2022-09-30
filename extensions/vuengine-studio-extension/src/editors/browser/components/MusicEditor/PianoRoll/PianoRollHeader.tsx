import { nls } from '@theia/core';
import React from 'react';

interface PianoRollHeaderProps {
}

export default function PianoRollHeader(props: PianoRollHeaderProps): JSX.Element {
    const classNames = ['pianoRollHeader'];

    return <div className={classNames.join(' ')}>
        <div
            className='pianoRollHeaderTitle'
            title={`${nls.localize('vuengine/musicEditor/channel', 'Channel')} / ${nls.localize('vuengine/musicEditor/pattern', 'Pattern')}`}
        >
            -
        </div>
        <div className='pianoRollHeaderAttributes'>

        </div>
    </div >;
}
