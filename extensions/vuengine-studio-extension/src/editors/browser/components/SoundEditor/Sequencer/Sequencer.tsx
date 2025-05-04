import React, { Dispatch, SetStateAction, useContext, useEffect, useMemo } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { ChannelConfig, SoundData } from '../SoundEditorTypes';
import Channel from './Channel';
import StepIndicator from './StepIndicator';
import { StyledSequencer, StyledSequencerHideToggle } from './StyledComponents';

interface SequencerProps {
    songData: SoundData
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
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentStep,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelSeeThrough,
        setChannel,
        sequencerHidden, setSequencerHidden,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const soloChannel = useMemo(() => songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1, [
        songData.channels,
    ]);

    const channels = useMemo(() => (
        songData.channels.map(channel =>
            <Channel
                key={channel.id}
                songData={songData}
                channel={channel}
                otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                currentChannelId={currentChannelId}
                setCurrentChannelId={setCurrentChannelId}
                currentPatternId={currentPatternId}
                setCurrentPatternId={setCurrentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setCurrentSequenceIndex={setCurrentSequenceIndex}
                setChannel={setChannel}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                toggleChannelSeeThrough={toggleChannelSeeThrough}
            />
        )
    ), [
        soloChannel,
        songData,
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
                if (currentSequenceIndex < songData.channels[currentChannelId].sequence.length - 1) {
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
        songData,
    ]);

    return <VContainer gap={0}>
        <StyledSequencer
            className={sequencerHidden ? 'hidden' : undefined}
            onWheel={mapVerticalToHorizontalScroll}
        >
            {<StepIndicator
                currentStep={currentStep}
                isPianoRoll={false}
                hidden={currentStep === -1}
            />}
            <VContainer gap={0} grow={1}>
                {channels}
            </VContainer>
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
