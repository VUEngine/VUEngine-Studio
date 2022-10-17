import React, { useContext } from 'react';
import { ChannelConfig, InstrumentConfig, MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';
import Channel from './Channel';
import StepIndicator from './StepIndicator';

interface SequencerProps {
    channels: ChannelConfig[]
    currentChannel: number
    currentPattern: number
    currentStep: number
    playing: boolean
    instruments: InstrumentConfig[]
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
    const { state, setState, songData, setSongData } = useContext(MusicEditorContext) as MusicEditorContextType;
    const {
        currentChannel,
        currentPattern,
        currentStep,
        playing,
        instruments,
        setCurrentChannel,
        setCurrentPattern,
        toggleChannelMuted,
        toggleChannelSolo,
        toggleChannelCollapsed,
        removeFromSequence,
        moveSequencePattern,
        addToSequence,
    } = props;

    const soloChannel = songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

    return <div className='sequencer'>
        {< StepIndicator
            currentStep={state.currentStep}
            pianoRollSize={undefined}
            hidden={!state.playing}
        />}
        {
            songData.channels.map(channel =>
                <Channel
                    key={`channel-${channel.id}`}
                    channelConfig={channel}
                    currentChannel={currentChannel}
                    currentPattern={currentPattern}
                    number={channel.id}
                    otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                    instrumentName={instruments[channel.instrument].name}
                    setCurrentChannel={setCurrentChannel}
                    setCurrentPattern={setCurrentPattern}
                    toggleChannelMuted={toggleChannelMuted}
                    toggleChannelSolo={toggleChannelSolo}
                    toggleChannelCollapsed={toggleChannelCollapsed}
                    removeFromSequence={removeFromSequence}
                    moveSequencePattern={moveSequencePattern}
                    addToSequence={addToSequence}
                />
            )
        }
    </div >;
}
