import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import StepIndicator from '../Sequencer/StepIndicator';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { BAR_NOTE_RESOLUTION, NOTES_PER_OCTAVE, NOTES_SPECTRUM, SoundData, SoundEvent, SUB_NOTE_RESOLUTION } from '../SoundEditorTypes';
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
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
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
    addPattern: (channelId: number, step: number) => void
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        soundData,
        noteCursor, setNoteCursor,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition, setCurrentPlayerPosition,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerHidden, setSequencerHidden,
        effectsPanelHidden, setEffectsPanelHidden,
        setNote,
        setNoteEvent,
        playNote,
        noteSnapping,
        addPattern,
    } = props;
    // eslint-disable-next-line no-null/no-null
    const pianoRollRef = useRef<HTMLDivElement>(null);

    const pattern = soundData.patterns[currentPatternId];
    const songSize = soundData.size * BAR_NOTE_RESOLUTION;

    const setPatternAtCursorPosition = () => {
        const bar = Math.floor(noteCursor / BAR_NOTE_RESOLUTION);
        console.log('bar', bar);
        let barToSelect = -1;
        let patternIdToSelect = '';
        const currentChannel = soundData.channels[currentChannelId];
        Object.keys(currentChannel.sequence).reverse().map(bStr => {
            const b = parseInt(bStr);
            const pId = currentChannel.sequence[b];
            const p = soundData.patterns[pId];
            if (barToSelect === -1 && b <= bar && b + p.size > bar) {
                barToSelect = b;
                patternIdToSelect = pId;
            }
        });

        if (barToSelect > -1) {
            setCurrentSequenceIndex(currentChannelId, barToSelect);
            setCurrentPatternId(currentChannelId, patternIdToSelect);
        } else {
            addPattern(currentChannelId, bar);
        }
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.id:
                if (noteCursor < songSize - SUB_NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor + SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.id:
                if (noteCursor >= SUB_NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor - SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_BAR.id:
                if (noteCursor < songSize - BAR_NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor + BAR_NOTE_RESOLUTION);
                } /* else {
                    setNoteCursor(songSize - SUB_NOTE_RESOLUTION);
                } */
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_BAR.id:
                if (noteCursor >= BAR_NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor - BAR_NOTE_RESOLUTION);
                } /* else {
                    setNoteCursor(0);
                } */
                break;
            case SoundEditorCommands.NOTE_UP.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] && pattern?.events[noteCursor][SoundEvent.Note] > 0) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] - 1);
                }
                break;
            case SoundEditorCommands.NOTE_DOWN.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] && pattern?.events[noteCursor][SoundEvent.Note] < NOTES_SPECTRUM - 1) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] + 1);
                }
                break;
            case SoundEditorCommands.CURSOR_UP_AN_OCTAVE.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] && pattern?.events[noteCursor][SoundEvent.Note] > NOTES_PER_OCTAVE) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] - NOTES_PER_OCTAVE);
                }
                break;
            case SoundEditorCommands.CURSOR_DOWN_AN_OCTAVE.id:
                if (pattern?.events[noteCursor] && pattern?.events[noteCursor][SoundEvent.Note] &&
                    pattern?.events[noteCursor][SoundEvent.Note] < NOTES_SPECTRUM - NOTES_PER_OCTAVE - 1) {
                    setNote(noteCursor, pattern?.events[noteCursor][SoundEvent.Note] + NOTES_PER_OCTAVE);
                }
                break;
            case SoundEditorCommands.SELECT_PATTERN_AT_CURSOR_POSITION.id:
                setPatternAtCursorPosition();
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
        // auto scroll to current pattern in piano roll
        /*
        pianoRollRef.current?.scrollTo({
            left: currentSequenceIndex * NOTE_RESOLUTION * PIANO_ROLL_NOTE_WIDTH,
            behavior: 'smooth',
        });
        */
    }, [
        currentPatternId,
    ]);

    return <StyledPianoRoll
        ref={pianoRollRef}
    >
        {<StepIndicator
            soundData={soundData}
            currentPlayerPosition={currentPlayerPosition}
            isPianoRoll={true}
            hidden={currentPlayerPosition === -1}
            effectsPanelHidden={effectsPanelHidden}
        />}
        <PianoRollHeader
            soundData={soundData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            playRangeStart={playRangeStart}
            setPlayRangeStart={setPlayRangeStart}
            playRangeEnd={playRangeEnd}
            setPlayRangeEnd={setPlayRangeEnd}
            setCurrentPlayerPosition={setCurrentPlayerPosition}
            sequencerHidden={sequencerHidden}
            setSequencerHidden={setSequencerHidden}
        />
        <PianoRollEditor
            soundData={soundData}
            currentChannelId={currentChannelId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
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
