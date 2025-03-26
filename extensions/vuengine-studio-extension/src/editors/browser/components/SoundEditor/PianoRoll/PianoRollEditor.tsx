import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, SoundEditorTool, SoundEvent, NOTES, SoundData } from '../SoundEditorTypes';
import PianoRollRow from './PianoRollRow';
import { StyledPianoRollEditor } from './StyledComponents';

interface PianoRollEditorProps {
    songData: SoundData
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    setCurrentTick: (note: number) => void
    setNote: (index: number, note: number | undefined) => void
    playNote: (note: number) => void
    tool: SoundEditorTool
    lastSetNoteId: number
    setLastSetNoteId: Dispatch<SetStateAction<number>>
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex,
        setCurrentTick,
        setNote,
        playNote,
        tool,
        lastSetNoteId, setLastSetNoteId,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;

    const channelsNotes = useMemo(() => {
        const currentChannel = songData.channels[currentChannelId];
        const currentPattern = currentChannel.patterns[currentPatternId];
        const currentPatternSize = BAR_PATTERN_LENGTH_MULT_MAP[currentPattern.bar] * songData.noteResolution;
        const result: { [noteId: number]: number[] }[] = [];
        songData.channels.forEach((otherChannel, channelIndex) => {
            let patternNoteOffset = 0;
            otherChannel.sequence.forEach(s => {
                const otherChannelPattern = otherChannel.patterns[s];
                const otherChannelPatternSize = BAR_PATTERN_LENGTH_MULT_MAP[otherChannelPattern.bar] * songData.noteResolution;
                [...Array(otherChannelPatternSize)].forEach((x, noteIndex) => {
                    const note = otherChannelPattern.events[noteIndex]
                        ? otherChannelPattern.events[noteIndex][SoundEvent.Note] ?? -1
                        : -1;
                    if (note !== undefined &&
                        // eslint-disable-next-line no-null/no-null
                        note !== null &&
                        noteIndex >= currentPatternNoteOffset - patternNoteOffset &&
                        noteIndex < currentPatternNoteOffset + currentPatternSize - patternNoteOffset
                    ) {
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
                patternNoteOffset += otherChannelPatternSize;
            });
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
            <PianoRollRow
                key={index}
                note={note}
                noteId={index}
                channelsNotes={channelsNotes}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                setCurrentTick={setCurrentTick}
                setNote={setNote}
                playNote={playNote}
                tool={tool}
                patternSize={patternSize}
                events={pattern.events}
                lastSetNoteId={lastSetNoteId}
                setLastSetNoteId={setLastSetNoteId}
                noteResolution={songData.noteResolution}
                bar={pattern.bar}
            />
        )}
    </StyledPianoRollEditor>;
}
