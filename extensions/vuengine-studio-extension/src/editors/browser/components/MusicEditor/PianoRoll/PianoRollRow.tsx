import React from 'react';
import PianoRollKey from './PianoRollKey';
import PianoRollNote from './PianoRollNote';
import { SongData } from '../MusicEditorTypes';

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

    return <div className={classNames.join(' ')}>
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
    </div>;
}
