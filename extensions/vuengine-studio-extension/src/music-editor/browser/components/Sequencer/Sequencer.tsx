import React from 'react';
import { ChannelConfig, MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import Channel from './Channel';
import StepIndicator from './StepIndicator';

interface SequencerProps {
    channels: ChannelConfig[]
    patterns: PatternConfig[]
    currentChannel: number
    currentPattern: number
    currentStep: number
    playing: boolean
    stateApi: MusicEditorStateApi
}

export default function Sequencer(props: SequencerProps): JSX.Element {
    const {
        channels,
        patterns,
        currentChannel,
        currentPattern,
        currentStep,
        playing,
        stateApi
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
                patterns={patterns}
                currentChannel={currentChannel}
                currentPattern={currentPattern}
                number={channel.id}
                otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                stateApi={stateApi}
            />
        )}
    </div>;
}
