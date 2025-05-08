import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { ChannelConfig, INPUT_BLOCKING_COMMANDS, MAX_PATTERN_SIZE, SoundData } from '../SoundEditorTypes';
import ChannelHeader from './ChannelHeader';
import LoopIndicator from './LoopIndicator';
import SequencerGrid from './SequencerGrid';
import StepIndicator from './StepIndicator';
import { StyledChannelHeaderContainer, StyledChannelsHeader, StyledSequencer, StyledSequencerHideToggle } from './StyledComponents';

interface SequencerProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentStep: number
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelSeeThrough: (channelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    sequencerHidden: boolean,
    setSequencerHidden: Dispatch<SetStateAction<boolean>>
    newPatternSize: number
    setNewPatternSize: Dispatch<SetStateAction<number>>
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentChannelId, setCurrentChannelId,
        currentPatternId, /* setCurrentPatternId, */
        currentSequenceIndex, setCurrentSequenceIndex,
        currentStep,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelSeeThrough,
        setChannel,
        sequencerHidden, setSequencerHidden,
        newPatternSize, setNewPatternSize,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const soloChannel = useMemo(() => soundData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1, [
        soundData.channels,
    ]);

    const channels = useMemo(() => (
        soundData.channels.map(channel =>
            <ChannelHeader
                key={channel.id}
                channel={channel}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                toggleChannelSeeThrough={toggleChannelSeeThrough}
                otherSolo={soloChannel > -1 && soloChannel !== channel.id}
            />
        )
    ), [
        soloChannel,
        soundData,
        currentChannelId,
        currentPatternId,
        currentSequenceIndex,
    ]);

    const mapVerticalToHorizontalScroll = (e: React.WheelEvent): void => {
        if (e.deltaY === 0) {
            return;
        }
        e.currentTarget.scrollTo({
            left: e.currentTarget.scrollLeft + e.deltaY
        });
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.SELECT_CHANNEL_1.id:
                setCurrentChannelId(0);
                break;
            case SoundEditorCommands.SELECT_CHANNEL_2.id:
                setCurrentChannelId(1);
                break;
            case SoundEditorCommands.SELECT_CHANNEL_3.id:
                setCurrentChannelId(2);
                break;
            case SoundEditorCommands.SELECT_CHANNEL_4.id:
                setCurrentChannelId(3);
                break;
            case SoundEditorCommands.SELECT_CHANNEL_5.id:
                setCurrentChannelId(4);
                break;
            case SoundEditorCommands.SELECT_CHANNEL_6.id:
                setCurrentChannelId(5);
                break;
            case SoundEditorCommands.SELECT_NEXT_CHANNEL.id:
                if (currentChannelId < 5) {
                    setCurrentChannelId(currentChannelId + 1);
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_CHANNEL.id:
                if (currentChannelId > 0) {
                    setCurrentChannelId(currentChannelId - 1);
                }
                break;
            case SoundEditorCommands.SELECT_NEXT_SEQUENCE_INDEX.id:
                if (currentSequenceIndex < soundData.channels[currentChannelId].sequence.length - 1) {
                    setCurrentSequenceIndex(currentChannelId, currentSequenceIndex + 1);
                }
                break;
            case SoundEditorCommands.SELECT_PREVIOUS_SEQUENCE_INDEX.id:
                if (currentSequenceIndex > 0) {
                    setCurrentSequenceIndex(currentChannelId, currentSequenceIndex - 1);
                }
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

    return <VContainer gap={0}>
        <StyledSequencer
            className={sequencerHidden ? 'hidden' : undefined}
            onWheel={mapVerticalToHorizontalScroll}
        >
            <StepIndicator
                currentStep={currentStep}
                isPianoRoll={false}
                hidden={currentStep === -1}
            />
            <LoopIndicator
                position={soundData.loopPoint}
                hidden={soundData.loopPoint === 0}
            />
            <HContainer gap={0} grow={1}>
                <StyledChannelHeaderContainer>
                    <StyledChannelsHeader>
                        <Input
                            title={nls.localize('vuengine/editors/sound/defaultPatternLength', 'Default Pattern Length')}
                            type='number'
                            size='small'
                            value={newPatternSize}
                            setValue={v => setNewPatternSize(v as number)}
                            min={1}
                            max={MAX_PATTERN_SIZE}
                            width={47}
                            commands={INPUT_BLOCKING_COMMANDS}
                        />
                    </StyledChannelsHeader>
                    {channels}
                </StyledChannelHeaderContainer>
                <SequencerGrid
                    soundData={soundData}
                    updateSoundData={updateSoundData}
                    currentChannelId={currentChannelId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setChannel={setChannel}
                />
            </HContainer>
        </StyledSequencer>
        <StyledSequencerHideToggle
            onClick={() => setSequencerHidden(prev => !prev)}
            title={`${SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_SEQUENCER_VISIBILITY.id, true)
                }`}
        >
            <i className={sequencerHidden ? 'fa fa-chevron-down' : 'fa fa-chevron-up'} />
        </StyledSequencerHideToggle>
    </VContainer>;
}
