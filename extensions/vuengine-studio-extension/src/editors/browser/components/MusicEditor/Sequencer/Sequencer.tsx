import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';
import Channel from './Channel';
import StepIndicator from './StepIndicator';

export default function Sequencer(): JSX.Element {
    const { state, songData } = useContext(MusicEditorContext) as MusicEditorContextType;

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
                    number={channel.id}
                    otherSolo={soloChannel > -1 && soloChannel !== channel.id}
                    instrumentName={songData.instruments[channel.instrument].name}
                />
            )
        }
    </div>;
}
