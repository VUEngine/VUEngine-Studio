import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, useMemo } from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, SoundEditorTool, SoundEvent, NOTES, SoundData, NOTE_RESOLUTION, PIANO_ROLL_NOTE_WIDTH, PIANO_ROLL_NOTE_HEIGHT } from '../SoundEditorTypes';
import PianoRollRow from './PianoRollRow';
import { StyledPianoRollEditor, StyledPianoRollPlacedNote } from './StyledComponents';
import { COLOR_PALETTE } from '../../Common/PaletteColorSelect';

const getLeftOffset = (index: number) =>
    53 + // piano
    1 * Math.floor(index / NOTE_RESOLUTION * 4) + // quarter note separators
    1 * Math.floor(index / NOTE_RESOLUTION) + // step / full note separators
    index * (PIANO_ROLL_NOTE_WIDTH + 1);

const getTopOffset = (note: number) => 20 + // meta line
    1 * Math.floor(note / 12) + // octave separators
    note * (PIANO_ROLL_NOTE_HEIGHT + 1);

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
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * NOTE_RESOLUTION;

    const channelsNotes = useMemo(() => {
        const currentChannel = songData.channels[currentChannelId];
        const currentPattern = currentChannel.patterns[currentPatternId];
        const currentPatternSize = BAR_PATTERN_LENGTH_MULT_MAP[currentPattern.bar] * NOTE_RESOLUTION;
        const result: React.JSX.Element[] = [];
        songData.channels.forEach((otherChannel, channelIndex) => {
            let patternNoteOffset = 0;
            otherChannel.sequence.forEach(s => {
                if (!otherChannel.seeThrough && otherChannel.id !== currentChannelId) {
                    return;
                }
                const otherChannelPattern = otherChannel.patterns[s];
                const otherChannelPatternSize = BAR_PATTERN_LENGTH_MULT_MAP[otherChannelPattern.bar] * NOTE_RESOLUTION;
                [...Array(otherChannelPatternSize)].forEach((x, noteIndex) => {
                    const note = otherChannelPattern.events[noteIndex]
                        ? otherChannelPattern.events[noteIndex][SoundEvent.Note] ?? -1
                        : -1;
                    const noteDuration = otherChannelPattern.events[noteIndex]
                        ? otherChannelPattern.events[noteIndex][SoundEvent.Duration] ?? 1
                        : 1;
                    // eslint-disable-next-line no-null/no-null
                    if (note !== undefined && note !== null && note > -1 &&
                        noteIndex >= currentPatternNoteOffset - patternNoteOffset &&
                        noteIndex < currentPatternNoteOffset + currentPatternSize - patternNoteOffset
                    ) {
                        const instrumentId = otherChannelPattern.events[noteIndex][SoundEvent.Instrument] ?? otherChannel.instrument;
                        const instrument = songData.instruments[instrumentId];
                        const instrumentColor = instrument.color ?? COLOR_PALETTE[0][0];
                        const index = patternNoteOffset + noteIndex - currentPatternNoteOffset;
                        const left = getLeftOffset(index);
                        const lastNoteLeft = getLeftOffset(index + noteDuration - 1);
                        const top = getTopOffset(note);
                        const width = lastNoteLeft - left + PIANO_ROLL_NOTE_WIDTH;
                        result.push(
                            <StyledPianoRollPlacedNote
                                key={`${otherChannel.id}-${index}`}
                                className={otherChannel.id !== currentChannelId ? 'oc' : undefined}
                                style={{
                                    backgroundColor: instrumentColor,
                                    color: chroma.contrast(instrumentColor, 'white') > 2
                                        ? 'white'
                                        : 'black',
                                    left,
                                    top,
                                    width,
                                }}
                                onClick={() => setCurrentTick(index)}
                            >
                                {Object.keys(NOTES)[note]}
                            </StyledPianoRollPlacedNote>
                        );
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
                currentPatternId={currentPatternId}
                setCurrentTick={setCurrentTick}
                setNote={setNote}
                playNote={playNote}
                tool={tool}
                patternSize={patternSize}
                lastSetNoteId={lastSetNoteId}
                setLastSetNoteId={setLastSetNoteId}
                bar={pattern.bar}
            />
        )}
        {channelsNotes}
    </StyledPianoRollEditor>;
}
