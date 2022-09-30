import React from 'react';
import { ChannelConfig } from '../types';
import Channel from './Channel';
import StepIndicator from './StepIndicator';

interface SequencerProps {
    channels: ChannelConfig[]
    currentChannel: number
    currentPattern: number
    currentStep: number
    playing: boolean
    setCurrentChannel: (id: number) => void
    setCurrentPattern: (channelId: number, patternId: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelCollapsed: (channelId: number) => void
    removeFromSequence: (channelId: number, index: number) => void
    moveSequencePattern: (channelId: number, from: number, to: number) => void
    addToSequence: (channelId: number, patternId: number) => void
}

export default function Sequencer(props: SequencerProps): JSX.Element {
    const {
        channels,
        currentChannel,
        currentPattern,
        currentStep,
        playing,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        removeFromSequence,
        moveSequencePattern,
        addToSequence,
    } = props;

    const classNames = ['sequencer'];

    const soloChannel = channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

    return <div className={classNames.join(' ')}>
        {<StepIndicator
            currentStep={currentStep}
            pianoRollSize={undefined}
            hidden={!playing}
        />}
        {channels.map(channel =>
            <Channel
                key={`channel-${channel.id}`}
                channelConfig={channel}
                currentChannel={currentChannel}
                currentPattern={currentPattern}
                number={channel.id}
                otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                setCurrentChannel={setCurrentChannel}
                setCurrentPattern={setCurrentPattern}
                toggleChannelMuted={toggleChannelMuted}
                toggleChannelSolo={toggleChannelSolo}
                toggleChannelCollapsed={toggleChannelCollapsed}
                removeFromSequence={removeFromSequence}
                moveSequencePattern={moveSequencePattern}
                addToSequence={addToSequence}
            />
        )}
    </div>;
}
