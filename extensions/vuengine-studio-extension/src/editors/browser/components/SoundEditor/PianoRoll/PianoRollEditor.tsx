import React, { useEffect, useMemo, useState } from 'react';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { NOTE_RESOLUTION, NOTES, SoundData, SoundEvent } from '../SoundEditorTypes';
import PianoRollPlacedNote from './PianoRollPlacedNote';
import PianoRollRow from './PianoRollRow';
import { StyledPianoRollEditor } from './StyledComponents';

interface PianoRollEditorProps {
    songData: SoundData
    currentChannelId: number
    currentPatternId: number
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    currentTick: number
    setCurrentTick: (note: number) => void
    setNote: (step: number, note?: number, duration?: number) => void
    playNote: (note: number) => void
}

export default function PianoRollEditor(props: PianoRollEditorProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex,
        currentTick,
        setCurrentTick,
        setNote,
        playNote,
    } = props;
    const [placeNote, setPlaceNote] = useState<number>(-1);
    const [placeNoteStep, setPlaceNoteStep] = useState<number>(-1);

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    const channelsNotes = useMemo(() => {
        const currentChannel = songData.channels[currentChannelId];
        const currentPattern = currentChannel.patterns[currentPatternId];
        const currentPatternSize = currentPattern.size * NOTE_RESOLUTION;
        const result: React.JSX.Element[] = [];
        songData.channels.forEach(otherChannel => {
            let patternNoteOffset = 0;
            otherChannel.sequence.forEach(s => {
                if (!otherChannel.seeThrough && otherChannel.id !== currentChannelId) {
                    return;
                }
                const otherChannelPattern = otherChannel.patterns[s];
                const otherChannelPatternSize = otherChannelPattern.size * NOTE_RESOLUTION;
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
                        const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
                        const step = patternNoteOffset + noteIndex - currentPatternNoteOffset;
                        result.push(
                            <PianoRollPlacedNote
                                key={`${otherChannel.id}-${step}`}
                                instrumentColor={instrumentColor}
                                note={note}
                                step={step}
                                duration={noteDuration}
                                currentChannelId={currentChannelId}
                                channelId={otherChannel.id}
                                currentTick={currentTick}
                                setCurrentTick={setCurrentTick}
                                setNote={setNote}
                                events={pattern.events}
                                patternSize={pattern.size}
                            />
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
        currentTick,
        songData.instruments[songData.channels[currentChannelId].instrument],
        setNote,
    ]);

    const grid = useMemo(() => Object.keys(NOTES).map((note, index) =>
        <PianoRollRow
            key={index}
            note={note}
            noteId={index}
            setCurrentTick={setCurrentTick}
            playNote={playNote}
            setPlaceNote={setPlaceNote}
            setPlaceNoteStep={setPlaceNoteStep}
        />
    ), []);

    useEffect(() => {
        if (placeNoteStep > -1 && placeNote > -1) {
            setNote(placeNoteStep, placeNote);
            setPlaceNote(-1);
            setPlaceNoteStep(-1);
        }
    }, [
        setNote,
        placeNote,
    ]);

    return <StyledPianoRollEditor>
        {grid}
        {channelsNotes}
    </StyledPianoRollEditor>;
}
