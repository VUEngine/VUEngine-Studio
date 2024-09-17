import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';
import { NOTES, SongData } from '../MusicEditorTypes';

interface NoteProps {
    current: boolean
    nth: boolean
    otherChannelSet: boolean
    set: boolean
}

const Note = styled.div<NoteProps>`
    background-color: ${p => p.set
        ? 'var(--theia-focusBorder) !important'
        : p.otherChannelSet
            ? 'var(--theia-editor-foreground) !important'
            : p.current
                ? 'var(--theia-secondaryButton-hoverBackground) !important'
                : 'var(--theia-secondaryButton-background)'
    };
    cursor: crosshair;
    flex-grow: 1;
    margin-bottom: 1px;
    margin-right: ${p => p.nth
        ? '3px'
        : '1px'
    };
    min-height: 11px;
    max-height: 11px;
    min-width: 17px;
    max-width: 17px;

    &:hover {
        outline: 1px solid var(--theia-focusBorder);
    }
`;

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
    if (current) {
        classNames.push('current');
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

    return <Note
        className={classNames.join(' ')}
        current={current}
        nth={(index + 1) % songData.bar === 0}
        set={set}
        otherChannelSet={otherChannels.length > 0}
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

