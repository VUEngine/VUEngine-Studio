import React from 'react';
import styled from 'styled-components';
import { LOWEST_NOTE, SongData } from '../MusicEditorTypes';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';

interface RowProps {
    cNote: boolean
    last: boolean
}

const Row = styled.div<RowProps>`
    min-height: ${p => p.last
        ? '11px'
        : p.cNote
            ? '14px'
            : '12px'
    };
    display: flex;
`;

interface PianoRollRowProps {
    songData: SongData
    note: string
    noteId: number
    currentChannelId: number
    currentPatternId: number
    currentNote: number
    setCurrentNote: (note: number) => void
    otherChannelsNotes: { [noteId: string]: number[] }[]
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
}

export default function PianoRollRow(props: PianoRollRowProps): React.JSX.Element {
    const {
        songData,
        note,
        noteId,
        otherChannelsNotes,
        currentChannelId,
        currentPatternId,
        currentNote, setCurrentNote,
        playNote,
        setNote,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const noteIdStr = noteId.toString();

    const classNames = ['pianoRollRow'];
    if (note.startsWith('C') && note.length === 2) {
        classNames.push('cNote');
    }

    return <Row
        className={classNames.join(' ')}
        cNote={note.startsWith('C') && note.length === 2}
        last={noteId === LOWEST_NOTE}
    >
        <PianoRollKey
            noteId={noteId}
            note={note}
            playNote={playNote}
        />
        {[...Array(pattern.size)].map((x, lineIndex) => {
            const otherChannelsIndex = Object.keys(otherChannelsNotes[lineIndex] ?? {}).find(key => key === noteIdStr);
            const otherChannels = otherChannelsIndex ? otherChannelsNotes[lineIndex][otherChannelsIndex] : [];
            return (
                <PianoRollNote
                    songData={songData}
                    key={`pianoroll-row-${lineIndex}-note-${note}`}
                    index={lineIndex}
                    noteId={noteId}
                    current={currentNote === lineIndex}
                    set={pattern.notes[lineIndex] === noteId}
                    otherChannels={otherChannels}
                    setCurrentNote={setCurrentNote}
                    playNote={playNote}
                    setNote={setNote}
                />);
        })}
    </Row>;
}
