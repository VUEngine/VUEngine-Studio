import React from 'react';
import { ChannelConfig, CurrentPattern, MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import Channel from './Channel';
import StepIndicator from './StepIndicator';

interface SequencerProps {
    channels: ChannelConfig[]
    patterns: PatternConfig[]
    currentPattern: CurrentPattern
    currentStep: number
    lowestNote: number
    highestNote: number
    playing: boolean
    stateApi: MusicEditorStateApi
}

export default function Sequencer(props: SequencerProps): JSX.Element {
    const {
        channels,
        patterns,
        currentPattern,
        currentStep,
        lowestNote,
        highestNote,
        playing,
        stateApi
    } = props;
    const classNames = ['sequencer'];

    let soloChannel = -1;
    channels.forEach((channel, index) => {
        if (channel.solo) {
            soloChannel = index;
        }
    });

    return <div className={classNames.join(' ')}>
        {playing && <StepIndicator
            currentStep={currentStep}
            playing={playing}
        />}
        {channels.map((channel, index) =>
            <Channel
                key={`channel-${index + 1}`}
                channelConfig={channel}
                patterns={patterns}
                currentPattern={currentPattern}
                number={index + 1}
                lowestNote={lowestNote}
                highestNote={highestNote}
                otherSolo={soloChannel > -1 && soloChannel !== index}
                stateApi={stateApi}
            />
        )}
    </div>;
}
