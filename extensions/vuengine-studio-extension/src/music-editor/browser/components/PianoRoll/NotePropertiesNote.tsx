import { nls } from '@theia/core';
import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../types';

interface NotePropertiesNoteProps {
    index: number
    current: boolean
    bar: number
    effects: string[]
    pattern: PatternConfig
    volumeL: number
    volumeR: number
    stateApi: MusicEditorStateApi
    setCurrentNote: (id: number) => void
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): JSX.Element {
    const { index, current, bar, volumeL, volumeR, effects, /* pattern, */ stateApi, setCurrentNote } = props;

    const classNames = ['notePropertiesNote'];
    if ((index + 1) % bar === 0) {
        classNames.push('nth');
    }
    if (current) {
        classNames.push('current');
    }

    const labelEffects = nls.localize('vuengine/musicEditor/effects', 'Effects');
    const leftLabel = nls.localize('vuengine/musicEditor/left', 'Left');
    const rightLabel = nls.localize('vuengine/musicEditor/right', 'Right');

    return <div
        className={classNames.join(' ')}
        title={`${effects.length} ${labelEffects}, ${leftLabel}: ${volumeL}%/${rightLabel}: ${volumeR}%`}
        onClick={() => setCurrentNote(index)}
        onContextMenu={() => stateApi.setNote(index, undefined)}
    >
        <div className='effects'>
        </div>
        <div className='volume'>
            <div style={{ height: `${volumeL}%` }} />
            <div style={{ height: `${volumeR}%` }} />
        </div>
    </div>;
}
