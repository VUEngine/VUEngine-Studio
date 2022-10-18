import React, { useContext } from 'react';
import { ChannelConfig, HIGHEST_NOTE, LOWEST_NOTE, MusicEditorContext, MusicEditorContextType, Notes } from '../MusicEditorTypes';
import AddPattern from './AddPattern';
import ChannelHeader from './ChannelHeader';
import Pattern from './Pattern';

interface ChannelProps {
    channelConfig: ChannelConfig
    number: number
    otherSolo: boolean
    instrumentName: string
}

export default function Channel(props: ChannelProps): JSX.Element {
    const { state, setCurrentChannel, toggleChannelCollapsed } = useContext(MusicEditorContext) as MusicEditorContextType;
    const { channelConfig, number, otherSolo, instrumentName } = props;

    const classNames = ['channel'];
    if (channelConfig.muted || otherSolo) {
        classNames.push('muted');
    }
    if (channelConfig.solo) {
        classNames.push('solo');
    }
    if (channelConfig.collapsed) {
        classNames.push('collapsed');
    }
    if (state.currentChannel === number) {
        classNames.push('current');
    }

    const patternHeight = Notes
        .filter((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE)
        .length;

    return channelConfig.collapsed
        ? <div
            className='collapsedChannel'
            onClick={() => toggleChannelCollapsed(number)}
        />
        : <div className={classNames.join(' ')}>
            <ChannelHeader
                channel={channelConfig}
                number={number}
                muted={channelConfig.muted}
                solo={channelConfig.solo}
                instrumentName={instrumentName}
            />
            {channelConfig.sequence.map((patternId, index) =>
                <Pattern
                    key={`channel-${number}-pattern-${index}`}
                    index={index}
                    channel={number}
                    pattern={channelConfig.patterns[patternId]}
                    patternId={patternId}
                    height={patternHeight}
                />)}
            <AddPattern
                channel={channelConfig}
                height={patternHeight}
            />
            <div
                className='patternFill'
                onClick={() => setCurrentChannel(number)}
            ></div>
        </div>;
}
