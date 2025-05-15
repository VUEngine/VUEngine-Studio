import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import StepIndicator from '../Sequencer/StepIndicator';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { NOTE_RESOLUTION, NOTES_PER_OCTAVE, NOTES_SPECTRUM, PIANO_ROLL_NOTE_WIDTH, SoundData, SoundEvent } from '../SoundEditorTypes';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';

const StyledPianoRoll = styled.div`
    align-items: start;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    overflow: auto;
    margin: 1px var(--padding) var(--padding);
    position: relative;
`;

interface PianoRollProps {
    soundData: SoundData
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentPatternNoteOffset: number
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentStep: number
    setCurrentStep: Dispatch<SetStateAction<number>>
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
    effectsPanelHidden: boolean,
    setEffectsPanelHidden: Dispatch<SetStateAction<boolean>>
    sequencerHidden: boolean,
    setSequencerHidden: Dispatch<SetStateAction<boolean>>
    setNote: (step: number, note?: number, prevStep?: number) => void
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    playNote: (note: number) => void
    noteSnapping: boolean
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        soundData,
        noteCursor, setNoteCursor,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentStep, setCurrentStep,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerHidden, setSequencerHidden,
        effectsPanelHidden, setEffectsPanelHidden,
        setNote,
        setNoteEvent,
        playNote,
        noteSnapping,
    } = props;
    // eslint-disable-next-line no-null/no-null
    const pianoRollRef = useRef<HTMLDivElement>(null);

    const pattern = soundData.patterns[currentPatternId];
    const patternSize = (pattern?.size ?? 1) * NOTE_RESOLUTION;

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.id:
                if (noteCursor < patternSize - 1) {
                    setNoteCursor(noteCursor + 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.id:
                if (noteCursor > 0) {
                    setNoteCursor(noteCursor - 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_BAR.id:
                if (noteCursor < patternSize - NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor + NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_BAR.id:
                if (noteCursor >= NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor - NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_UP.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] && pattern?.events[noteCursor][SoundEvent.Note] > 0) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] - 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_DOWN.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] && pattern?.events[noteCursor][SoundEvent.Note] < NOTES_SPECTRUM - 1) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] + 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_UP_AN_OCTAVE.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] && pattern?.events[noteCursor][SoundEvent.Note] > NOTES_PER_OCTAVE) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] - NOTES_PER_OCTAVE);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_DOWN_AN_OCTAVE.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] &&
                    pattern?.events[noteCursor][SoundEvent.Note] < NOTES_SPECTRUM - NOTES_PER_OCTAVE - 1) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] + NOTES_PER_OCTAVE);
                }
                break;
            case SoundEditorCommands.REMOVE_CURRENT_NOTE.id:
                setNote(noteCursor);
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        soundData,
        noteCursor,
    ]);

    useEffect(() => {
        pianoRollRef.current?.scrollTo({
            left: currentSequenceIndex * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH,
            behavior: 'smooth',
        });
    }, [
        currentPatternId,
        currentPatternNoteOffset,
    ]);

    return <StyledPianoRoll
        ref={pianoRollRef}
    >
        {<StepIndicator
            soundData={soundData}
            currentStep={currentStep}
            isPianoRoll={true}
            hidden={currentStep === -1}
            effectsPanelHidden={effectsPanelHidden}
        />}
        <PianoRollHeader
            soundData={soundData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            currentPatternNoteOffset={currentPatternNoteOffset}
            playRangeStart={playRangeStart}
            setPlayRangeStart={setPlayRangeStart}
            playRangeEnd={playRangeEnd}
            setPlayRangeEnd={setPlayRangeEnd}
            setCurrentStep={setCurrentStep}
            sequencerHidden={sequencerHidden}
            setSequencerHidden={setSequencerHidden}
        />
        <PianoRollEditor
            soundData={soundData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setCurrentPatternId={setCurrentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentSequenceIndex={setCurrentSequenceIndex}
            noteCursor={noteCursor}
            setNoteCursor={setNoteCursor}
            setNote={setNote}
            setNoteEvent={setNoteEvent}
            playNote={playNote}
            noteSnapping={noteSnapping}
        />
        <NoteProperties
            soundData={soundData}
            noteCursor={noteCursor}
            setNoteCursor={setNoteCursor}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setCurrentPatternId={setCurrentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentSequenceIndex={setCurrentSequenceIndex}
            effectsPanelHidden={effectsPanelHidden}
            setEffectsPanelHidden={setEffectsPanelHidden}
            setNote={setNote}
        />
    </StyledPianoRoll>;
}
