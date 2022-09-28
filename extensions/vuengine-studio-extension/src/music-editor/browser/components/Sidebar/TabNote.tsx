import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import CurrentNote from './CurrentNote';

interface TabNoteProps {
    pattern: PatternConfig | boolean
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function TabNote(props: TabNoteProps): JSX.Element {
    const { pattern, currentNote, stateApi } = props;

    return <>
        <CurrentNote
            pattern={pattern as PatternConfig}
            currentNote={currentNote}
            stateApi={stateApi}
        />
    </>;
}
