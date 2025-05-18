import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    TrackConfig,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_ADD_TRACK_BUTTON_HEIGHT,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_HEIGHT_MAX,
    SEQUENCER_PATTERN_HEIGHT_MIN,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_MAX,
    SEQUENCER_PATTERN_WIDTH_MIN,
    SoundData
} from '../SoundEditorTypes';
import TrackHeader from './TrackHeader';
import LoopIndicator from './LoopIndicator';
import PlacedPattern from './PlacedPattern';
import SequencerGrid from './SequencerGrid';
import StepIndicator from './StepIndicator';
import { ScaleControls } from '../PianoRoll/PianoRoll';

export const StyledSequencerContainer = styled.div`
    margin: 0 var(--padding);
    padding-right: 10px;
    position: relative;
`;

export const StyledSequencer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 11px;
    position: relative;
    user-select: none;
`;

export const StyledTrackHeaderContainer = styled.div`
    border-right: 1px solid rgba(255, 255, 255, .6);
    display: flex;
    flex-direction: column;
    left: 0;
    position: sticky;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-right-color: rgba(0, 0, 0, .6);
    }
`;

const StyledTracksHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    height: ${SEQUENCER_GRID_METER_HEIGHT}px;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }
`;

const StyledAddTrackButton = styled.button`
    align-items: center;
    background-color: var(--theia-editor-background);
    border: 1px solid var(--theia-dropdown-border);
    box-sizing: border-box;
    color: var(--theia-dropdown-border);
    cursor: pointer;
    display: flex;
    justify-content: center;
    left: 0;
    margin-top: 2px;
    min-height: ${SEQUENCER_ADD_TRACK_BUTTON_HEIGHT}px !important;
    position: sticky;
    width: ${PIANO_ROLL_KEY_WIDTH + 2}px;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    i {
        font-size: 12px !important;
    }
`;

interface SequencerProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentTrackId: number
    setCurrentTrackId: Dispatch<SetStateAction<number>>
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    currentPlayerPosition: number
    toggleTrackMuted: (trackId: number) => void
    toggleTrackSolo: (trackId: number) => void
    toggleTrackSeeThrough: (trackId: number) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    addPattern: (trackId: number, step: number) => void
    setTrackDialogOpen: Dispatch<SetStateAction<boolean>>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    effectsPanelHidden: boolean
    pianoRollNoteHeight: number
    pianoRollNoteWidth: number
    sequencerPatternHeight: number
    setSequencerPatternHeight: Dispatch<SetStateAction<number>>
    sequencerPatternWidth: number
    setSequencerPatternWidth: Dispatch<SetStateAction<number>>
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentTrackId, setCurrentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition,
        toggleTrackMuted,
        toggleTrackSolo,
        toggleTrackSeeThrough,
        setTrack,
        addPattern,
        setTrackDialogOpen, setPatternDialogOpen,
        effectsPanelHidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, setSequencerPatternHeight,
        sequencerPatternWidth, setSequencerPatternWidth,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const soloTrack = useMemo(() =>
        soundData.tracks.filter(c => c.solo).map((c, i) => i).pop() ?? -1,
        [
            soundData.tracks,
        ]
    );

    const mapVerticalToHorizontalScroll = (e: React.WheelEvent): void => {
        if (e.deltaY === 0) {
            return;
        }
        e.currentTarget.scrollTo({
            left: e.currentTarget.scrollLeft + e.deltaY
        });
    };

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey) {
            if (e.shiftKey) {
                let newPatternWidth = Math.round(sequencerPatternWidth - (e.deltaX / 8));

                if (newPatternWidth > SEQUENCER_PATTERN_WIDTH_MAX) {
                    newPatternWidth = SEQUENCER_PATTERN_WIDTH_MAX;
                } else if (newPatternWidth < SEQUENCER_PATTERN_WIDTH_MIN) {
                    newPatternWidth = SEQUENCER_PATTERN_WIDTH_MIN;
                }

                setSequencerPatternWidth(newPatternWidth);
            } else {
                let newPatternHeight = Math.round(sequencerPatternHeight - (e.deltaY / 4));

                if (newPatternHeight > SEQUENCER_PATTERN_HEIGHT_MAX) {
                    newPatternHeight = SEQUENCER_PATTERN_HEIGHT_MAX;
                } else if (newPatternHeight < SEQUENCER_PATTERN_HEIGHT_MIN) {
                    newPatternHeight = SEQUENCER_PATTERN_HEIGHT_MIN;
                }

                setSequencerPatternHeight(newPatternHeight);
            }

            e.stopPropagation();
        }
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.SELECT_TRACK_1.id:
                if (soundData.tracks.length > 0) {
                    setCurrentTrackId(0);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_2.id:
                if (soundData.tracks.length > 1) {
                    setCurrentTrackId(1);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_3.id:
                if (soundData.tracks.length > 2) {
                    setCurrentTrackId(2);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_4.id:
                if (soundData.tracks.length > 3) {
                    setCurrentTrackId(3);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_5.id:
                if (soundData.tracks.length > 4) {
                    setCurrentTrackId(4);
                }
                break;
            case SoundEditorCommands.SELECT_TRACK_6.id:
                if (soundData.tracks.length > 5) {
                    setCurrentTrackId(5);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_TRACK.id:
                if (currentTrackId < soundData.tracks.length - 1) {
                    setCurrentTrackId(currentTrackId + 1);
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_TRACK.id:
                if (currentTrackId > 0) {
                    setCurrentTrackId(currentTrackId - 1);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_SEQUENCE_INDEX.id:
                /*
                if (currentSequenceIndex < soundData.channels[currentTrackId].sequence.length - 1) {
                    setCurrentSequenceIndex(currentTrackId, currentSequenceIndex + 1);
                }
                */
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX.id:
                /*
                if (currentSequenceIndex > 0) {
                    setCurrentSequenceIndex(currentTrackId, currentSequenceIndex - 1);
                }
                */
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        currentTrackId,
        currentSequenceIndex,
        soundData,
    ]);

    return <StyledSequencerContainer
        onWheel={onWheel}
    >
        <ScaleControls className="vertical">
            <button onClick={() => setSequencerPatternHeight(prev =>
                prev < SEQUENCER_PATTERN_HEIGHT_MAX ? prev + 2 : prev
            )}>
                <i className="codicon codicon-plus" />
            </button>
            <button onClick={() => setSequencerPatternHeight(SEQUENCER_PATTERN_HEIGHT_DEFAULT)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => setSequencerPatternHeight(prev =>
                prev > SEQUENCER_PATTERN_HEIGHT_MIN ? prev - 2 : prev
            )}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
        </ScaleControls>
        <ScaleControls>
            <button onClick={() => setSequencerPatternWidth(prev =>
                prev > SEQUENCER_PATTERN_WIDTH_MIN ? prev - 2 : prev
            )}>
                <i className="codicon codicon-chrome-minimize" />
            </button>
            <button onClick={() => setSequencerPatternWidth(SEQUENCER_PATTERN_WIDTH_DEFAULT)}>
                <i className="codicon codicon-circle-large" />
            </button>
            <button onClick={() => setSequencerPatternWidth(prev =>
                prev < SEQUENCER_PATTERN_WIDTH_MAX ? prev + 2 : prev
            )}>
                <i className="codicon codicon-plus" />
            </button>
        </ScaleControls>
        <StyledSequencer
            onWheel={mapVerticalToHorizontalScroll}
        >
            <StepIndicator
                soundData={soundData}
                currentPlayerPosition={currentPlayerPosition}
                isPianoRoll={false}
                hidden={currentPlayerPosition === -1}
                effectsPanelHidden={effectsPanelHidden}
                pianoRollNoteHeight={pianoRollNoteHeight}
                pianoRollNoteWidth={pianoRollNoteWidth}
                sequencerPatternHeight={sequencerPatternHeight}
            />
            <LoopIndicator
                position={soundData.loopPoint}
                hidden={!soundData.loop}
            />
            <HContainer gap={0} grow={1}>
                <StyledTrackHeaderContainer>
                    <StyledTracksHeader>
                    </StyledTracksHeader>
                    {soundData.tracks.map((track, index) =>
                        <TrackHeader
                            key={index}
                            track={track}
                            trackId={index}
                            currentTrackId={currentTrackId}
                            setCurrentTrackId={setCurrentTrackId}
                            toggleTrackMuted={toggleTrackMuted}
                            toggleTrackSolo={toggleTrackSolo}
                            toggleTrackSeeThrough={toggleTrackSeeThrough}
                            otherSolo={soloTrack > -1 && soloTrack !== index}
                            setTrackDialogOpen={setTrackDialogOpen}
                            sequencerPatternHeight={sequencerPatternHeight}
                        />
                    )}
                </StyledTrackHeaderContainer>
                {soundData.tracks.map((track, index) =>
                    Object.keys(track.sequence).map(key => {
                        const step = parseInt(key);
                        const patternId = track.sequence[step];
                        const pattern = soundData.patterns[patternId];
                        const patternIndex = Object.keys(soundData.patterns).indexOf(patternId);
                        if (!pattern) {
                            return;
                        }
                        return <PlacedPattern
                            key={`${index}-${step}`}
                            soundData={soundData}
                            updateSoundData={updateSoundData}
                            patternIndex={patternIndex}
                            step={step}
                            trackId={index}
                            pattern={pattern}
                            patternId={patternId}
                            currentTrackId={currentTrackId}
                            currentPatternId={currentPatternId}
                            currentSequenceIndex={currentSequenceIndex}
                            setCurrentSequenceIndex={setCurrentSequenceIndex}
                            setTrack={setTrack}
                            setPatternDialogOpen={setPatternDialogOpen}
                            sequencerPatternHeight={sequencerPatternHeight}
                            sequencerPatternWidth={sequencerPatternWidth}
                        />;
                    })
                )}
                <SequencerGrid
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    setCurrentPatternId={setCurrentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setTrack={setTrack}
                    addPattern={addPattern}
                    sequencerPatternHeight={sequencerPatternHeight}
                    sequencerPatternWidth={sequencerPatternWidth}
                />
            </HContainer>
            {soundData.tracks.length < VSU_NUMBER_OF_CHANNELS &&
                <StyledAddTrackButton
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_TRACK.id)}
                    title={nls.localizeByDefault('Add')}
                >
                    <i className='codicon codicon-plus' />
                </StyledAddTrackButton>
            }
        </StyledSequencer>
    </StyledSequencerContainer>;
}
