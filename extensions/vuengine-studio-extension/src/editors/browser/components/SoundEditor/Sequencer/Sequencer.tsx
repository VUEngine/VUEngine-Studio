import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    ChannelConfig,
    PIANO_ROLL_KEY_WIDTH,
    SEQUENCER_ADD_CHANNEL_BUTTON_HEIGHT,
    SEQUENCER_GRID_METER_HEIGHT,
    SEQUENCER_PATTERN_HEIGHT_DEFAULT,
    SEQUENCER_PATTERN_HEIGHT_MAX,
    SEQUENCER_PATTERN_HEIGHT_MIN,
    SEQUENCER_PATTERN_WIDTH_DEFAULT,
    SEQUENCER_PATTERN_WIDTH_MAX,
    SEQUENCER_PATTERN_WIDTH_MIN,
    SoundData
} from '../SoundEditorTypes';
import ChannelHeader from './ChannelHeader';
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

    &.hidden {
        height: 0 !important;
        padding-bottom: 0;
    }
`;

export const StyledChannelHeaderContainer = styled.div`
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

const StyledChannelsHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    height: ${SEQUENCER_GRID_METER_HEIGHT}px;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }
`;

const StyledAddChannelButton = styled.button`
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
    min-height: ${SEQUENCER_ADD_CHANNEL_BUTTON_HEIGHT}px !important;
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
    currentChannelId: number
    setCurrentChannelId: Dispatch<SetStateAction<number>>
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentPlayerPosition: number
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelSeeThrough: (channelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    addPattern: (channelId: number, step: number) => void
    setChannelDialogOpen: Dispatch<SetStateAction<boolean>>
    setPatternDialogOpen: Dispatch<SetStateAction<boolean>>
    sequencerHidden: boolean
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
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentPlayerPosition,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelSeeThrough,
        setChannel,
        addPattern,
        setChannelDialogOpen, setPatternDialogOpen,
        sequencerHidden,
        effectsPanelHidden,
        pianoRollNoteHeight, pianoRollNoteWidth,
        sequencerPatternHeight, setSequencerPatternHeight,
        sequencerPatternWidth, setSequencerPatternWidth,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const soloChannel = useMemo(() =>
        soundData.channels.filter(c => c.solo).map((c, i) => i).pop() ?? -1,
        [
            soundData.channels,
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
            case SoundEditorCommands.SELECT_CHANNEL_1.id:
                if (soundData.channels.length > 0) {
                    setCurrentChannelId(0);
                }
                break;
            case SoundEditorCommands.SELECT_CHANNEL_2.id:
                if (soundData.channels.length > 1) {
                    setCurrentChannelId(1);
                }
                break;
            case SoundEditorCommands.SELECT_CHANNEL_3.id:
                if (soundData.channels.length > 2) {
                    setCurrentChannelId(2);
                }
                break;
            case SoundEditorCommands.SELECT_CHANNEL_4.id:
                if (soundData.channels.length > 3) {
                    setCurrentChannelId(3);
                }
                break;
            case SoundEditorCommands.SELECT_CHANNEL_5.id:
                if (soundData.channels.length > 4) {
                    setCurrentChannelId(4);
                }
                break;
            case SoundEditorCommands.SELECT_CHANNEL_6.id:
                if (soundData.channels.length > 5) {
                    setCurrentChannelId(5);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_CHANNEL.id:
                if (currentChannelId < soundData.channels.length - 1) {
                    setCurrentChannelId(currentChannelId + 1);
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_CHANNEL.id:
                if (currentChannelId > 0) {
                    setCurrentChannelId(currentChannelId - 1);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_SEQUENCE_INDEX.id:
                /*
                if (currentSequenceIndex < soundData.channels[currentChannelId].sequence.length - 1) {
                    setCurrentSequenceIndex(currentChannelId, currentSequenceIndex + 1);
                }
                */
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX.id:
                /*
                if (currentSequenceIndex > 0) {
                    setCurrentSequenceIndex(currentChannelId, currentSequenceIndex - 1);
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
        currentChannelId,
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
            className={sequencerHidden ? 'hidden' : undefined}
            onWheel={mapVerticalToHorizontalScroll}
            style={{
                height: soundData.channels.length * sequencerPatternHeight + SEQUENCER_GRID_METER_HEIGHT +
                    (soundData.channels.length < VSU_NUMBER_OF_CHANNELS ? SEQUENCER_ADD_CHANNEL_BUTTON_HEIGHT + 2 : 0),
            }}
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
                <StyledChannelHeaderContainer>
                    <StyledChannelsHeader>
                    </StyledChannelsHeader>
                    {soundData.channels.map((channel, index) =>
                        <ChannelHeader
                            key={index}
                            channel={channel}
                            channelId={index}
                            currentChannelId={currentChannelId}
                            setCurrentChannelId={setCurrentChannelId}
                            toggleChannelMuted={toggleChannelMuted}
                            toggleChannelSolo={toggleChannelSolo}
                            toggleChannelSeeThrough={toggleChannelSeeThrough}
                            otherSolo={soloChannel > -1 && soloChannel !== index}
                            setChannelDialogOpen={setChannelDialogOpen}
                            sequencerPatternHeight={sequencerPatternHeight}
                        />
                    )}
                </StyledChannelHeaderContainer>
                {soundData.channels.map((channel, index) =>
                    Object.keys(channel.sequence).map(key => {
                        const step = parseInt(key);
                        const patternId = channel.sequence[step];
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
                            channelId={index}
                            pattern={pattern}
                            patternId={patternId}
                            currentChannelId={currentChannelId}
                            currentPatternId={currentPatternId}
                            currentSequenceIndex={currentSequenceIndex}
                            setCurrentSequenceIndex={setCurrentSequenceIndex}
                            setChannel={setChannel}
                            setPatternDialogOpen={setPatternDialogOpen}
                            sequencerPatternHeight={sequencerPatternHeight}
                            sequencerPatternWidth={sequencerPatternWidth}
                        />;
                    })
                )}
                <SequencerGrid
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    currentChannelId={currentChannelId}
                    currentPatternId={currentPatternId}
                    setCurrentPatternId={setCurrentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setChannel={setChannel}
                    addPattern={addPattern}
                    sequencerPatternHeight={sequencerPatternHeight}
                    sequencerPatternWidth={sequencerPatternWidth}
                />
            </HContainer>
            {soundData.channels.length < VSU_NUMBER_OF_CHANNELS &&
                <StyledAddChannelButton
                    onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_CHANNEL.id)}
                    title={nls.localizeByDefault('Add')}
                >
                    <i className='codicon codicon-plus' />
                </StyledAddChannelButton>
            }
        </StyledSequencer>
    </StyledSequencerContainer>;
}
