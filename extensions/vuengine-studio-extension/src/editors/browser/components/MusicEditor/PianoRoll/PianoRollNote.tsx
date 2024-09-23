import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';
import { MusicEditorTool, NOTES } from '../MusicEditorTypes';

interface NoteProps {
    current: boolean
    noteResolution: number
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
    margin-right: 1px;
    min-height: 11px;
    max-height: 11px;
    min-width: 15px;
    max-width: 15px;

    &:hover {
        outline: 1px solid var(--theia-focusBorder);
        outline-offset: 1px;
        z-index: 10;
    }
    &:nth-child(4n + 1) {
        margin-right: 2px;
    }
    &:nth-child(${p => p.noteResolution}n + 1) {
        margin-right: 3px;
    }
`;

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
        noteResolution={noteResolution}
        set={set}
        otherChannelSet={otherChannels.length > 0}
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

