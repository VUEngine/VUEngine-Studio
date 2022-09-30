import React from 'react';
import { PatternConfig } from '../types';
import CurrentNote from './CurrentNote';

interface TabNoteProps {
    pattern: PatternConfig | boolean
    currentNote: number
    setNote: (noteIndex: number, note: number | undefined) => void
    setVolumeL: (noteIndex: number, volume: number | undefined) => void
    setVolumeR: (noteIndex: number, volume: number | undefined) => void
}

export default function TabNote(props: TabNoteProps): JSX.Element {
    const { pattern, currentNote, setNote, setVolumeL, setVolumeR } = props;

    return <>
        <CurrentNote
            pattern={pattern as PatternConfig}
            currentNote={currentNote}
            setNote={setNote}
            setVolumeL={setVolumeL}
            setVolumeR={setVolumeR}
        />
    </>;
}
