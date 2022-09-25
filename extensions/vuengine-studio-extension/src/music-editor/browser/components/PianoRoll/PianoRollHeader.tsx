import { nls } from '@theia/core';
import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';

interface PianoRollHeaderProps {
    pattern: PatternConfig
    stateApi: MusicEditorStateApi
}

export default function PianoRollHeader(props: PianoRollHeaderProps): JSX.Element {
    const { pattern, stateApi } = props;

    const classNames = ['pianoRollHeader'];

    return <div className={classNames.join(' ')}>
        <div
            className='pianoRollHeaderTitle'
            title={`${nls.localize('vuengine/musicEditor/channel', 'Channel')} / ${nls.localize('vuengine/musicEditor/pattern', 'Pattern')}`}
        >
            {pattern.channel} / {pattern.id}
        </div>
        <div className='pianoRollHeaderAttributes'>
            <select
                className='theia-select'
                onChange={e => {
                    stateApi.setPatternSize(pattern.channel, pattern.id, parseInt(e.target.value));
                    e.stopPropagation();
                }}
                value={pattern.size}
            >
                <option value={16}>Size: 16</option>
                <option value={32}>Size: 32</option>
                <option value={64}>Size: 64</option>
            </select>
        </div>
    </div >;
}
