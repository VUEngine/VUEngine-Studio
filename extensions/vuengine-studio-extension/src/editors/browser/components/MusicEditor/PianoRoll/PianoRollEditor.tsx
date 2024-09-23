import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BAR_PATTERN_LENGTH_MULT_MAP, HIGHEST_NOTE, LOWEST_NOTE, MusicEditorTool, NOTES, SongData } from '../MusicEditorTypes';
import PianoRollRow from './PianoRollRow';

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
    tool: MusicEditorTool
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
        tool,
    } = props;

    const otherChannelsNotes = useMemo(() => {
        const currentChannel = songData.channels[currentChannelId];
        const currentPattern = currentChannel.patterns[currentPatternId];
        const currentPatternSize = BAR_PATTERN_LENGTH_MULT_MAP[currentPattern.bar] * songData.noteResolution;
        const result: { [noteId: number]: number[] }[] = [];
        songData.channels.forEach((channel, channelIndex) => {
            if (channelIndex !== currentChannelId) {
                let patternNoteOffset = 0;
                channel.sequence.forEach(s => {
                    const pattern = channel.patterns[s];
                    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;
                    [...Array(patternSize)].forEach((x, noteIndex) => {
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
                    patternNoteOffset += patternSize;
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
                tool={tool}
            />)}
    </StyledPianoRollEditor>;
}
