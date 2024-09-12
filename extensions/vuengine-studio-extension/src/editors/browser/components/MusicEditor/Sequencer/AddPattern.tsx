import { nls } from '@theia/core';
import React from 'react';
import { ChannelConfig, SongData } from '../MusicEditorTypes';

interface AddPatternProps {
    channel: ChannelConfig
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    songData: SongData
    setCurrentPatternId: (channel: number, patternId: number) => void
}

export default function AddPattern(props: AddPatternProps): React.JSX.Element {
    const {
        channel, setChannel,
        songData,
        setCurrentPatternId,
    } = props;

    const addToSequence = (channelId: number, patternId: number): void => {
        const updatedChannel = {
            ...songData.channels[channelId],
            sequence: [
                ...songData.channels[channelId].sequence,
                patternId
            ],
        };

        const largestPatternId = songData.channels[channelId].patterns.length - 1;
        if (patternId > largestPatternId) {
            updatedChannel.patterns.push({
                name: '',
                size: songData.defaultPatternSize,
                notes: [],
                volumeL: [],
                volumeR: [],
                effects: [],
            });
        }

        setChannel(channelId, updatedChannel);
        setCurrentPatternId(channelId, patternId);
    };

    return <div
        title={nls.localize('vuengine/musicEditor/addPattern', 'Add Pattern')}
        className="addPattern"
    >
        <i className='codicon codicon-plus' />
        <div className='patternSelect'>
            <button
                className='newPattern'
                onClick={() => addToSequence(channel.id, channel.patterns.length)}
            >
                <i className='codicon codicon-plus' />
            </button>
            <div className='existingPatterns'>
                {channel.patterns.map((pattern, patternId) => (
                    <button
                        key={`channel-${channel.id}-add-${patternId}`}
                        onClick={() => addToSequence(channel.id, patternId)}
                    >
                        {patternId + 1}
                    </button>
                ))}
            </div>
        </div>
    </div>;
}
