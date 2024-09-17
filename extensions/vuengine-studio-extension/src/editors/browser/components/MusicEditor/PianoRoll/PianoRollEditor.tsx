import React, { useMemo } from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, NOTES, SongData } from '../MusicEditorTypes';
import PianoRollRow from './PianoRollRow';
import styled from 'styled-components';

export const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    height: 100%;
    overflow-y: scroll;
    padding: 1px 0;
`;

interface PianoRollEditorProps {
    songData: SongData
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    currentNote: number
    setCurrentNote: (note: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex,
        currentNote, setCurrentNote,
        setNote,
        playNote,
    } = props;

    const otherChannelsNotes = useMemo(() => {
        const currentChannel = songData.channels[currentChannelId];
        const currentPatternSize = currentChannel.patterns[currentPatternId].size;
        const result: { [noteId: number]: number[] }[] = [];
        songData.channels.forEach((channel, channelIndex) => {
            if (channelIndex !== currentChannelId) {
                let patternNoteOffset = 0;
                channel.sequence.forEach(s => {
                    const pattern = channel.patterns[s];
                    [...Array(pattern.size)].forEach((x, noteIndex) => {
                        const note = pattern.notes[noteIndex];
                        if (note && noteIndex >= currentPatternNoteOffset - patternNoteOffset && noteIndex < currentPatternNoteOffset + currentPatternSize - patternNoteOffset) {
                            const index = patternNoteOffset + noteIndex - currentPatternNoteOffset;
                            if (result[index] === undefined) {
                                result[index] = {};
                            }
                            if (result[index][note] === undefined) {
                                result[index][note] = [];
                            }
                            result[index][note].push(channelIndex);
                        }
                    });
                    patternNoteOffset += pattern.size;
                });
            }
        });
        return result;
    }, [
        songData.channels,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
    ]);

    return <StyledPianoRollEditor>
        {Object.keys(NOTES).map((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE && <PianoRollRow
                songData={songData}
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                otherChannelsNotes={otherChannelsNotes}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                currentNote={currentNote}
                setCurrentNote={setCurrentNote}
                setNote={setNote}
                playNote={playNote}
            />)}
    </StyledPianoRollEditor>;
}
