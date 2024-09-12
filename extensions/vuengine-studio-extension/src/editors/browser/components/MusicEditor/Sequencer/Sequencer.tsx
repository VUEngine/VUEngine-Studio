import React from 'react';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import Channel from './Channel';
import StepIndicator from './StepIndicator';

interface SequencerProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    currentPatternId: number
    setCurrentPatternId: (channel: number, patternId: number) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    currentStep: number
    playing: boolean
    getChannelName: (channelId: number) => string
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
}

export default function Sequencer(props: SequencerProps): React.JSX.Element {
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        currentStep,
        playing,
        getChannelName,
        toggleChannelMuted,
        toggleChannelSolo,
        setChannel,
    } = props;

    const soloChannel = songData.channels.filter(c => c.solo).map(c => c.id).pop() ?? -1;

    return <div className='sequencer'>
        {< StepIndicator
            currentStep={currentStep}
            pianoRollSize={undefined}
            hidden={!playing}
        />}
        {
            songData.channels.map(channel =>
                <Channel
                    key={channel.id}
                    channelConfig={channel}
                    number={channel.id}
                    songData={songData}
                    otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                    instrumentName={songData.instruments[channel.instrument].name}
                    currentChannelId={currentChannelId}
                    setCurrentChannelId={setCurrentChannelId}
                    getChannelName={getChannelName}
                    toggleChannelMuted={toggleChannelMuted}
                    toggleChannelSolo={toggleChannelSolo}
                    currentPatternId={currentPatternId}
                    setCurrentPatternId={setCurrentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setChannel={setChannel}
                />
            )
        }
    </div>;
}
