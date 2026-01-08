import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import StepIndicator from '../Sequencer/StepIndicator';
import { SetNoteEventProps, SetNoteProps } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    BAR_NOTE_RESOLUTION,
    NOTE_RESOLUTION,
    NOTES_LABELS,
    NOTES_PER_OCTAVE,
    NOTES_SPECTRUM,
    PIANO_ROLL_GRID_METER_HEIGHT,
    PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    PIANO_ROLL_NOTE_HEIGHT_MAX,
    PIANO_ROLL_NOTE_HEIGHT_MIN,
    PIANO_ROLL_NOTE_WIDTH_MAX,
    PIANO_ROLL_NOTE_WIDTH_MIN,
    SCROLL_BAR_WIDTH,
    ScrollWindow,
    SEQUENCER_RESOLUTION,
    SoundData,
    SoundEvent,
    SUB_NOTE_RESOLUTION,
    TrackSettings
} from '../SoundEditorTypes';
import NoteProperties from './NoteProperties';
import PianoRollEditor from './PianoRollEditor';
import PianoRollHeader from './PianoRollHeader';
import PianoRollPlacedNote from './PianoRollPlacedNote';

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

    body.theia-light &,
    body.theia-hc & {
        border-left-color: rgba(0, 0, 0, .6);
    }
`;

export const ScaleControls = styled.div`
    bottom: 0;
    display: flex;
    right: 10px;
    padding: 0 0 0 1px;
    position: absolute;
    z-index: 900;

    button {
        background-color: rgba(255, 255, 255, .1);
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

        body.theia-light &,
        body.theia-hc & {
            background-color: rgba(0, 0, 0, .1);
        }

        &:hover {
            background-color: var(--theia-focusBorder);
            color: #fff;
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

export const StyledToggleButtonContainer = styled.div`
    background: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    border-right: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    display: flex;
    left: 0;
    margin-bottom: -${PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 1}px;
    max-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    overflow: hidden;
    position: sticky;
    top: 1px;
    z-index: 250;

    body.theia-light &,
    body.theia-hc & {
        border-color: rgba(0, 0, 0, .6);
    }
`;

const StyledToggleButton = styled.button`
    align-items: center;
    background-color: transparent;
    border: none;
    color: var(--theia-editor-foreground);
    cursor: pointer;
    display: flex;
    font-size: 10px;
    justify-content: center;
    min-height: ${PIANO_ROLL_GRID_METER_HEIGHT + PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - 2}px !important;
    outline-offset: -1px;
    width: 50%;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

interface PianoRollProps {
    soundData: SoundData
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    currentPlayerPosition: number
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
    setNote: (notes: SetNoteProps[]) => void
    setNoteEvent: (notes: SetNoteEventProps[]) => void
    playNote: (note: string, instrumentId?: string) => void
    selectedNotes: number[]
    setSelectedNotes: Dispatch<SetStateAction<number[]>>
    noteSnapping: boolean
    addPattern: (trackId: number, bar: number, size?: number) => Promise<boolean>
    pianoRollNoteHeight: number
    setPianoRollNoteHeight: Dispatch<SetStateAction<number>>
    pianoRollNoteWidth: number
    setPianoRollNoteWidth: Dispatch<SetStateAction<number>>
    sequencerPatternHeight: number
    sequencerPatternWidth: number
    pianoRollScrollWindow: ScrollWindow
    setPianoRollScrollWindow: Dispatch<SetStateAction<ScrollWindow>>
    setCurrentInstrumentId: Dispatch<SetStateAction<string>>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    removePatternFromSequence: (trackId: number, step: number) => void
    trackSettings: TrackSettings[]
}

export default function PianoRoll(props: PianoRollProps): React.JSX.Element {
    const { services, onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        noteCursor, setNoteCursor,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        sequencerHidden, setSequencerHidden,
        effectsPanelHidden, setEffectsPanelHidden,
        eventListHidden, setEventListHidden,
        setNote,
        setNoteEvent,
        playNote,
        selectedNotes, setSelectedNotes,
        noteSnapping,
        addPattern,
        pianoRollNoteHeight, setPianoRollNoteHeight,
        pianoRollNoteWidth, setPianoRollNoteWidth,
        sequencerPatternHeight, sequencerPatternWidth,
        pianoRollScrollWindow, setPianoRollScrollWindow,
        setCurrentInstrumentId,
        setPatternDialogOpen,
        removePatternFromSequence,
        trackSettings,
    } = props;
    const pianoRollRef = useRef<HTMLDivElement>(null);

    const pattern = soundData.patterns[currentPatternId];
    const songLength = soundData.size / SEQUENCER_RESOLUTION * BAR_NOTE_RESOLUTION;

    const setPatternAtCursorPosition = async (cursor?: number, size?: number): Promise<boolean> => {
        const noteCursorStep = Math.floor((cursor ?? noteCursor) / SUB_NOTE_RESOLUTION / SEQUENCER_RESOLUTION);
        let stepToSelect = -1;
        const currentTrack = soundData.tracks[currentTrackId];
        Object.keys(currentTrack.sequence).reverse().map(bStr => {
            const b = parseInt(bStr);
            const pId = currentTrack.sequence[b];
            const p = soundData.patterns[pId];
            if (stepToSelect === -1 && b <= noteCursorStep && b + p.size > noteCursorStep) {
                stepToSelect = b;
            }
        });

        if (stepToSelect > -1) {
            setCurrentSequenceIndex(currentTrackId, stepToSelect);
            return true;
        } else {
            return addPattern(currentTrackId, noteCursorStep, size);
        }
    };

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey || e.metaKey) {
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

    const getScrollWindowCoords = () => {
        if (!pianoRollRef.current) {
            return;
        }

        setPianoRollScrollWindow({
            x: pianoRollRef.current.scrollLeft,
            y: pianoRollRef.current.scrollTop,
            w: pianoRollRef.current.offsetWidth - PIANO_ROLL_KEY_WIDTH - 2 - SCROLL_BAR_WIDTH,
            h: pianoRollRef.current.offsetHeight - PIANO_ROLL_GRID_METER_HEIGHT - PIANO_ROLL_GRID_PLACED_PATTERN_HEIGHT - SCROLL_BAR_WIDTH,
        });
    };

    const placedNotesCurrentPattern = useMemo(() => {
        const track = soundData.tracks[currentTrackId];
        const patternId = track?.sequence[currentSequenceIndex];
        const p = soundData.patterns[patternId];
        if (!p) {
            return;
        }
        const result: React.JSX.Element[] = [];
        Object.keys(p.events).map(stepStr => {
            const step = parseInt(stepStr);
            const noteLabel = p.events[step][SoundEvent.Note] ?? '';
            const noteDuration = p.events[step][SoundEvent.Duration] ?? 1;
            if (noteLabel !== undefined && noteLabel !== null && noteLabel !== '') {
                const instrumentId = p.events[step][SoundEvent.Instrument] ?? track.instrument;
                const instrument = soundData.instruments[instrumentId];
                const instrumentColor = COLOR_PALETTE[instrument?.color ?? DEFAULT_COLOR_INDEX];
                result.push(
                    <PianoRollPlacedNote
                        key={step}
                        instrumentColor={instrumentColor}
                        noteLabel={noteLabel}
                        step={currentSequenceIndex * BAR_NOTE_RESOLUTION / SEQUENCER_RESOLUTION + step}
                        duration={noteDuration}
                        currentSequenceIndex={currentSequenceIndex}
                        selected={selectedNotes.includes(step)}
                        setNoteCursor={setNoteCursor}
                        setNote={setNote}
                        setNoteEvent={setNoteEvent}
                        events={p.events}
                        patternSize={p.size}
                        noteSnapping={noteSnapping}
                        pianoRollNoteHeight={pianoRollNoteHeight}
                        pianoRollNoteWidth={pianoRollNoteWidth}
                        setCurrentInstrumentId={setCurrentInstrumentId}
                    />
                );
            }
        });

        return result;
    }, [
        soundData.tracks[currentTrackId],
        currentTrackId,
        currentSequenceIndex,
        noteCursor,
        soundData.instruments,
        setNote,
    ]);

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_STEP.id:
                if (noteCursor < songLength - SUB_NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor + SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_PREVIOUS_STEP.id:
                if (noteCursor >= SUB_NOTE_RESOLUTION) {
                    setNoteCursor(noteCursor - SUB_NOTE_RESOLUTION);
                }
                break;
            case SoundEditorCommands.PIANO_ROLL_SELECT_NEXT_BAR.id:
                if (noteCursor < songLength - BAR_NOTE_RESOLUTION) {
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
            case SoundEditorCommands.NOTES_UP.id:
                setNote(selectedNotes.map(sn => {
                    const p: SetNoteProps = { step: sn };
                    if (pattern?.events[sn] && pattern?.events[sn][SoundEvent.Note]) {
                        const newNoteId = NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]) - 1;
                        if (newNoteId >= 0 && newNoteId < NOTES_SPECTRUM - 1) {
                            p.note = NOTES_LABELS[newNoteId];
                        }
                    }
                    return p;
                }));
                break;
            case SoundEditorCommands.NOTES_DOWN.id:
                setNote(selectedNotes.map(sn => {
                    const p: SetNoteProps = { step: sn };
                    if (pattern?.events[sn] && pattern?.events[sn][SoundEvent.Note]) {
                        const newNoteId = NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]) + 1;
                        if (newNoteId >= 0 && newNoteId < NOTES_SPECTRUM - 1) {
                            p.note = NOTES_LABELS[newNoteId];
                        }
                    }
                    return p;
                }));
                break;
            case SoundEditorCommands.NOTES_UP_AN_OCTAVE.id:
                setNote(selectedNotes.map(sn => {
                    const p: SetNoteProps = { step: sn };
                    if (pattern?.events[sn] && pattern?.events[sn][SoundEvent.Note]) {
                        const newNoteId = NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]) - NOTES_PER_OCTAVE;
                        if (newNoteId >= 0 && newNoteId < NOTES_SPECTRUM - 1) {
                            p.note = NOTES_LABELS[newNoteId];
                        }
                    }
                    return p;
                }));
                break;
            case SoundEditorCommands.NOTES_DOWN_AN_OCTAVE.id:
                setNote(selectedNotes.map(sn => {
                    const p: SetNoteProps = { step: sn };
                    if (pattern?.events[sn] && pattern?.events[sn][SoundEvent.Note]) {
                        const newNoteId = NOTES_LABELS.indexOf(pattern.events[sn][SoundEvent.Note]) + NOTES_PER_OCTAVE;
                        if (newNoteId >= 0 && newNoteId < NOTES_SPECTRUM - 1) {
                            p.note = NOTES_LABELS[newNoteId];
                        }
                    }
                    return p;
                }));
                break;
            case SoundEditorCommands.SELECT_PATTERN_AT_CURSOR_POSITION.id:
                setPatternAtCursorPosition();
                break;
            case SoundEditorCommands.REMOVE_SELECTED_NOTES.id:
                setNote(selectedNotes.map(sn => ({ step: sn })));
                break;
        }
    };

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        soundData,
        noteCursor,
    ]);

    useEffect(() => {
        // auto scroll to current pattern in piano roll
        pianoRollRef.current?.scrollTo({
            left: currentSequenceIndex / SEQUENCER_RESOLUTION * NOTE_RESOLUTION * pianoRollNoteWidth,
            behavior: 'smooth',
        });
    }, [
        currentSequenceIndex,
    ]);

    useEffect(() => {
        getScrollWindowCoords();
    }, [
        songLength,
        effectsPanelHidden,
        pianoRollNoteWidth,
        sequencerPatternWidth,
    ]);

    useEffect(() => {
        if (!pianoRollRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => getScrollWindowCoords());
        resizeObserver.observe(pianoRollRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return <StyledPianoRollContainer
        onWheel={onWheel}
    >
        <ScaleControls className="vertical">
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_REDUCE.id)}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_RESET.id)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_VERTICAL_SCALE_INCREASE.id)}>
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <ScaleControls>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_REDUCE.id)}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_RESET.id)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => services.commandService.executeCommand(SoundEditorCommands.PIANO_ROLL_HORIZONTAL_SCALE_INCREASE.id)}>
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <StyledPianoRoll
            ref={pianoRollRef}
            onScroll={getScrollWindowCoords}
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
                sequencerPatternWidth={sequencerPatternWidth}
            />}
            {placedNotesCurrentPattern}
            <StyledToggleButtonContainer>
                <StyledToggleButton
                    onClick={() => setEventListHidden(prev => !prev)}
                    title={`${SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(
                        SoundEditorCommands.TOGGLE_EVENT_LIST_VISIBILITY.id,
                        true
                    )}`}
                >
                    <i className="codicon codicon-list-unordered" />
                    <i className={eventListHidden ? 'codicon codicon-chevron-right' : 'codicon codicon-chevron-left'} />
                </StyledToggleButton>
                <StyledToggleButton
                    onClick={() => setSequencerHidden(prev => !prev)}
                    title={`${SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(
                        SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id,
                        true
                    )}`}
                >
                    <i className="codicon codicon-layers" />
                    <i className={sequencerHidden ? 'codicon codicon-chevron-down' : 'codicon codicon-chevron-up'} />
                </StyledToggleButton>
            </StyledToggleButtonContainer>
            <PianoRollHeader
                soundData={soundData}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
                pianoRollNoteWidth={pianoRollNoteWidth}
                setPatternAtCursorPosition={setPatternAtCursorPosition}
                pianoRollScrollWindow={pianoRollScrollWindow}
                setPatternDialogOpen={setPatternDialogOpen}
                removePatternFromSequence={removePatternFromSequence}
            />
            <PianoRollEditor
                soundData={soundData}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                noteCursor={noteCursor}
                setNoteCursor={setNoteCursor}
                setNote={setNote}
                playNote={playNote}
                setSelectedNotes={setSelectedNotes}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                setPatternAtCursorPosition={setPatternAtCursorPosition}
                pianoRollScrollWindow={pianoRollScrollWindow}
                pianoRollRef={pianoRollRef}
                trackSettings={trackSettings}
            />
            <NoteProperties
                soundData={soundData}
                noteCursor={noteCursor}
                setNoteCursor={setNoteCursor}
                currentTrackId={currentTrackId}
                currentPatternId={currentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                effectsPanelHidden={effectsPanelHidden}
                setEffectsPanelHidden={setEffectsPanelHidden}
                pianoRollNoteWidth={pianoRollNoteWidth}
                pianoRollScrollWindow={pianoRollScrollWindow}
            />
        </StyledPianoRoll>
    </StyledPianoRollContainer>;
}
