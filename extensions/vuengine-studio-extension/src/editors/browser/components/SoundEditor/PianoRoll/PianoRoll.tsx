import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
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
    margin: 2px var(--padding) var(--padding);
    position: relative;
`;

interface PianoRollProps {
    soundData: SoundData
    currentTick: number
    setCurrentTick: (currentTick: number) => void
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
    setNote: (step: number, note?: number, prevStep?: number) => void
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    playNote: (note: number) => void
    newNoteDuration: number
    setNewNoteDuration: Dispatch<SetStateAction<number>>
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        soundData,
        currentTick, setCurrentTick,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        currentPatternNoteOffset,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentStep, setCurrentStep,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        setNote,
        setNoteEvent,
        playNote,
        newNoteDuration, setNewNoteDuration
    } = props;
    // eslint-disable-next-line no-null/no-null
    const pianoRollRef = useRef<HTMLDivElement>(null);

    const pattern = soundData.patterns[currentPatternId];
    const patternSize = pattern.size * NOTE_RESOLUTION;

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.id:
                if (currentTick < patternSize - 1) {
                    setCurrentTick(currentTick + 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.id:
                if (currentTick > 0) {
                    setCurrentTick(currentTick - 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_BAR.id:
                if (currentTick < patternSize - NOTE_RESOLUTION) {
                    setCurrentTick(currentTick + NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_BAR.id:
                if (currentTick >= NOTE_RESOLUTION) {
                    setCurrentTick(currentTick - NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_UP.id:
                if (pattern.events[currentTick] && pattern.events[currentTick][SoundEvent.Note] && pattern.events[currentTick][SoundEvent.Note] > 0) {
                    setNote(currentTick, pattern.events[currentTick][SoundEvent.Note] - 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_DOWN.id:
                if (pattern.events[currentTick] && pattern.events[currentTick][SoundEvent.Note] && pattern.events[currentTick][SoundEvent.Note] < NOTES_SPECTRUM - 1) {
                    setNote(currentTick, pattern.events[currentTick][SoundEvent.Note] + 1);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_UP_AN_OCTAVE.id:
                if (pattern.events[currentTick] && pattern.events[currentTick][SoundEvent.Note] && pattern.events[currentTick][SoundEvent.Note] > NOTES_PER_OCTAVE) {
                    setNote(currentTick, pattern.events[currentTick][SoundEvent.Note] - NOTES_PER_OCTAVE);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_NOTE_DOWN_AN_OCTAVE.id:
                if (pattern.events[currentTick] && pattern.events[currentTick][SoundEvent.Note] &&
                    pattern.events[currentTick][SoundEvent.Note] < NOTES_SPECTRUM - NOTES_PER_OCTAVE - 1) {
                    setNote(currentTick, pattern.events[currentTick][SoundEvent.Note] + NOTES_PER_OCTAVE);
                }
                break;
            case SoundEditorCommands.REMOVE_CURRENT_NOTE.id:
                setNote(currentTick);
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
        currentTick,
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
        />}
        <AdvancedSelect
            title={nls.localize('vuengine/editors/sound/defaultNoteLength', 'Default Note Length')}
            defaultValue={newNoteDuration.toString()}
            onChange={options => setNewNoteDuration(parseInt(options[0]))}
            options={[{
                label: '1',
                value: '16'
            }, {
                label: '1/2',
                value: '8'
            }, {
                label: '1/4',
                value: '4'
            }, {
                label: '1/8',
                value: '2'
            }, {
                label: '1/16',
                value: '1'
            }]}
            width={47}
            small={true}
            style={{
                marginBottom: -16,
                position: 'fixed',
                zIndex: 300,
            }}
        />
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
        />
        <PianoRollEditor
            soundData={soundData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setCurrentPatternId={setCurrentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentSequenceIndex={setCurrentSequenceIndex}
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            setNote={setNote}
            setNoteEvent={setNoteEvent}
            playNote={playNote}
        />
        <NoteProperties
            soundData={soundData}
            currentTick={currentTick}
            setCurrentTick={setCurrentTick}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            setCurrentPatternId={setCurrentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setCurrentSequenceIndex={setCurrentSequenceIndex}
            setNote={setNote}
        />
    </StyledPianoRoll>;
}
