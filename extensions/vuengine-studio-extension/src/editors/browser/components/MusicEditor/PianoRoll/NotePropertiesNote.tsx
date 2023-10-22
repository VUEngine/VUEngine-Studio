import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';

interface NotePropertiesNoteProps {
    index: number
    current: boolean
    effects: string[]
    volumeL: number
    volumeR: number
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): React.JSX.Element {
    const { songData, setCurrentNote, setNote } = useContext(MusicEditorContext) as MusicEditorContextType;
    const { index, current, volumeL, volumeR, effects } = props;

    const classNames = ['notePropertiesNote'];
    if ((index + 1) % songData.bar === 0) {
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
        onContextMenu={() => setNote(index, undefined)}
    >
        <div className='effects'>
        </div>
        <div className='volume'>
            <div style={{ height: `${volumeL}%` }} />
            <div style={{ height: `${volumeR}%` }} />
        </div>
    </div>;
}
