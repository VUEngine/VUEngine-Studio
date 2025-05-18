import React, { Dispatch, SetStateAction, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import StepIndicator from '../Sequencer/StepIndicator';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    BAR_NOTE_RESOLUTION,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_NOTE_HEIGHT_DEFAULT,
    PIANO_ROLL_NOTE_HEIGHT_MAX,
    PIANO_ROLL_NOTE_HEIGHT_MIN,
    PIANO_ROLL_NOTE_WIDTH_DEFAULT,
    PIANO_ROLL_NOTE_WIDTH_MAX,
    PIANO_ROLL_NOTE_WIDTH_MIN,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
} from '../SoundEditorTypes';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';

const StyledPianoRollContainer = styled.div`
    display: flex;
    flex-grow: 1;
    height: 100%;
    position: relative;
    width: 1px;
`;

const StyledPianoRoll = styled.div`
    flex-grow: 1;
    font-size: 10px;
    overflow: scroll;
    position: relative;
`;

export const ScaleControls = styled.div`
    background-color: var(--theia-editor-background);
    bottom: 0;
    display: flex;
    right: 10px;
    padding: 0 0 0 1px;
    position: absolute;
    z-index: 9000;

    button {
        background-color: var(--theia-secondaryButton-background);
        border: none;
        border-radius: 0;
        color: var(--theia-secondaryButton-foreground);
        cursor: pointer;
        line-height: 8px;
        min-height: 10px;
        max-height: 10px;
        min-width: 16px;
        max-width: 16px;
        outline: none;
        padding: 0;

        &:hover {
            background-color: var(--theia-focusBorder);
        }

        .codicon {
            font-size: 8px;
        }
    }

    &.vertical {
        bottom: 10px;
        flex-direction: column;
        padding: 1px 0 0 0;
        right: 0;

        button {
            line-height: 14px;
            min-height: 16px;
            max-height: 16px;
            min-width: 10px;
            max-width: 10px;
        }
    }
`;

interface PianoRollProps {
    soundData: SoundData
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
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
    eventListHidden: boolean,
    setEventListHidden: Dispatch<SetStateAction<boolean>>
    setNote: (step: number, note?: number, prevStep?: number) => void
    setNoteEvent: (step: number, event: SoundEvent, value?: any) => void
    playNote: (note: number) => void
    noteSnapping: boolean
    addPattern: (trackId: number, step: number) => void
    pianoRollNoteHeight: number
    setPianoRollNoteHeight: Dispatch<SetStateAction<number>>
    pianoRollNoteWidth: number
    setPianoRollNoteWidth: Dispatch<SetStateAction<number>>
    sequencerPatternHeight: number
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const {
        soundData,
        noteCursor, setNoteCursor,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition, setCurrentPlayerPosition,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerHidden, setSequencerHidden,
        effectsPanelHidden, setEffectsPanelHidden,
        eventListHidden, setEventListHidden,
        setNote,
        setNoteEvent,
        playNote,
        noteSnapping,
        addPattern,
        pianoRollNoteHeight, setPianoRollNoteHeight,
        pianoRollNoteWidth, setPianoRollNoteWidth,
        sequencerPatternHeight,
    } = props;
    // eslint-disable-next-line no-null/no-null
    const pianoRollRef = useRef<HTMLDivElement>(null);

    const pattern = soundData.patterns[currentPatternId];
    const songSize = soundData.size * BAR_NOTE_RESOLUTION;

    const setPatternAtCursorPosition = () => {
        const bar = Math.floor(noteCursor / BAR_NOTE_RESOLUTION);
        let barToSelect = -1;
        let patternIdToSelect = '';
        const currentTrack = soundData.tracks[currentTrackId];
        Object.keys(currentTrack.sequence).reverse().map(bStr => {
            const b = parseInt(bStr);
            const pId = currentTrack.sequence[b];
            const p = soundData.patterns[pId];
            if (barToSelect === -1 && b <= bar && b + p.size > bar) {
                barToSelect = b;
                patternIdToSelect = pId;
            }
        });

        if (barToSelect > -1) {
            setCurrentSequenceIndex(currentTrackId, barToSelect);
            setCurrentPatternId(currentTrackId, patternIdToSelect);
        } else {
            setCurrentSequenceIndex(currentTrackId, bar);
            addPattern(currentTrackId, bar);
        }
    };

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey) {
            if (e.shiftKey) {
                let newNoteWidth = Math.round(pianoRollNoteWidth - (e.deltaX / 8));

                if (newNoteWidth > PIANO_ROLL_NOTE_WIDTH_MAX) {
                    newNoteWidth = PIANO_ROLL_NOTE_WIDTH_MAX;
                } else if (newNoteWidth < PIANO_ROLL_NOTE_WIDTH_MIN) {
                    newNoteWidth = PIANO_ROLL_NOTE_WIDTH_MIN;
                }

                setPianoRollNoteWidth(newNoteWidth);
            } else {
                let newNoteHeight = Math.round(pianoRollNoteHeight - (e.deltaY / 4));

                if (newNoteHeight > PIANO_ROLL_NOTE_HEIGHT_MAX) {
                    newNoteHeight = PIANO_ROLL_NOTE_HEIGHT_MAX;
                } else if (newNoteHeight < PIANO_ROLL_NOTE_HEIGHT_MIN) {
                    newNoteHeight = PIANO_ROLL_NOTE_HEIGHT_MIN;
                }

                setPianoRollNoteHeight(newNoteHeight);
            }

            e.stopPropagation();
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
            left: currentSequenceIndex * NOTE_RESOLUTION * pianoRollNoteWidth,
            behavior: 'smooth',
        });
        */
    }, [
        currentPatternId,
    ]);

    return <StyledPianoRollContainer
        onWheel={onWheel}
    >
        <ScaleControls className="vertical">
            <button onClick={() => setPianoRollNoteHeight(prev =>
                prev < PIANO_ROLL_NOTE_HEIGHT_MAX ? prev + 1 : prev
            )}>
                <i className="codicon codicon-plus" />
            </button>
            <button onClick={() => setPianoRollNoteHeight(PIANO_ROLL_NOTE_HEIGHT_DEFAULT)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => setPianoRollNoteHeight(prev =>
                prev > PIANO_ROLL_NOTE_HEIGHT_MIN ? prev - 1 : prev
            )}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
        </ScaleControls>
        <ScaleControls>
            <button onClick={() => setPianoRollNoteWidth(prev =>
                prev > PIANO_ROLL_NOTE_WIDTH_MIN ? prev - 1 : prev
            )}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button onClick={() => setPianoRollNoteWidth(PIANO_ROLL_NOTE_WIDTH_DEFAULT)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => setPianoRollNoteWidth(prev =>
                prev < PIANO_ROLL_NOTE_WIDTH_MAX ? prev + 1 : prev
            )}>
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <StyledPianoRoll
            ref={pianoRollRef}
        >
            {<StepIndicator
                soundData={soundData}
                currentPlayerPosition={currentPlayerPosition}
                isPianoRoll={true}
                hidden={currentPlayerPosition === -1}
                effectsPanelHidden={effectsPanelHidden}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                sequencerPatternHeight={sequencerPatternHeight}
            />}
            <PianoRollHeader
                soundData={soundData}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
                setCurrentPlayerPosition={setCurrentPlayerPosition}
                sequencerHidden={sequencerHidden}
                setSequencerHidden={setSequencerHidden}
                eventListHidden={eventListHidden}
                setEventListHidden={setEventListHidden}
                pianoRollNoteWidth={pianoRollNoteWidth}
            />
            <PianoRollEditor
                soundData={soundData}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                noteCursor={noteCursor}
                setNoteCursor={setNoteCursor}
                setNote={setNote}
                setNoteEvent={setNoteEvent}
                playNote={playNote}
                noteSnapping={noteSnapping}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
            />
            <NoteProperties
                soundData={soundData}
                noteCursor={noteCursor}
                setNoteCursor={setNoteCursor}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                setCurrentPatternId={setCurrentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setCurrentSequenceIndex={setCurrentSequenceIndex}
                effectsPanelHidden={effectsPanelHidden}
                setEffectsPanelHidden={setEffectsPanelHidden}
                setNote={setNote}
                pianoRollNoteWidth={pianoRollNoteWidth}
            />
        </StyledPianoRoll>
    </StyledPianoRollContainer>;
}
