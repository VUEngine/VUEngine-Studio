import { nls } from '@theia/core';
import React from 'react';
import { MusicEditorTool, NOTES } from '../MusicEditorTypes';
import { StyledPianoRollNote } from './StyledComponents';

interface PianoRollNoteProps {
    index: number
    noteId: number
    noteResolution: number
    set: boolean
    otherChannels: number[]
    current: boolean
    setCurrentNote: (note: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
    tool: MusicEditorTool
}

export default function PianoRollNote(props: PianoRollNoteProps): React.JSX.Element {
    const { index, noteId, current, set, otherChannels, noteResolution, playNote, setCurrentNote, setNote, tool } = props;

    // Object.keys(otherChannelsNotes[index] ?? {}).includes(noteIdStr)

    const classNames = [`noteResolution${noteResolution}`];
    if (current) {
        classNames.push('current');
    }
    if (set) {
        classNames.push('set');
    }
    if (otherChannels.length > 0) {
        classNames.push('otherChannelSet');
    }

    let title = `${nls.localize('vuengine/musicEditor/note', 'Note')}: ${Object.keys(NOTES)[noteId]}`;
    if (otherChannels.length) {
        const prefix = otherChannels.length === 1
            ? nls.localize('vuengine/musicEditor/setOnChannel', 'Set on channel')
            : nls.localize('vuengine/musicEditor/setOnChannels', 'Set on channels');
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

    return <StyledPianoRollNote
        className={classNames.join(' ')}
        onClick={() => {
            if (tool === MusicEditorTool.ERASER) {
                setNote(index, undefined);
            } else {
                setNote(index, noteId);
                setCurrentNote(index);
                playNote(noteId);
            }
        }}
        onContextMenu={() => setNote(index, undefined)}
        onMouseDown={e => onMouse(e)}
        onMouseOver={e => onMouse(e)}
        title={title}
    />;
}

