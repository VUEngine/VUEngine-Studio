import { nls } from '@theia/core';
import React from 'react';
import { NOTES, SongData } from '../MusicEditorTypes';

interface PianoRollNoteProps {
    songData: SongData
    index: number
    noteId: number
    set: boolean
    otherChannels: number[]
    current: boolean
    setCurrentNote: (note: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
}

export default function PianoRollNote(props: PianoRollNoteProps): React.JSX.Element {
    const { index, noteId, current, set, otherChannels, songData, playNote, setCurrentNote, setNote } = props;

    // Object.keys(otherChannelsNotes[index] ?? {}).includes(noteIdStr)

    const classNames = ['pianoRollNote'];
    if ((index + 1) % songData.bar === 0) {
        classNames.push('nth');
    }
    if (set) {
        classNames.push('set');
    } else if (otherChannels.length) {
        classNames.push('otherChannelSet');
    }
    if (current) {
        classNames.push('current');
    }

    let title = `${nls.localize('vuengine/musicEditor/note', 'Note')}: ${Object.keys(NOTES)[noteId]}`;
    if (otherChannels.length) {
        const prefix = otherChannels.length === 1
            ? nls.localize('vuengine/musicEditor/alsoOnChannel', 'Also on channel')
            : nls.localize('vuengine/musicEditor/alsoOnChannels', 'Also on channels');
        title += ` – ${prefix} ${otherChannels.join(', ')}`;
    }

    const onMouse = (e: React.MouseEvent<HTMLElement>) => {
        if (e.buttons === 1) {
            setNote(index, noteId);
            playNote(noteId);
        } else if (e.buttons === 2) {
            setNote(index, undefined);
        }
        e.preventDefault();
    };

    return <div
        className={classNames.join(' ')}
        onClick={() => {
            setNote(index, noteId);
            setCurrentNote(index);
            playNote(noteId);
        }}
        onContextMenu={() => setNote(index, undefined)}
        onMouseDown={e => onMouse(e)}
        onMouseOver={e => onMouse(e)}
        title={title}
    />;
}

