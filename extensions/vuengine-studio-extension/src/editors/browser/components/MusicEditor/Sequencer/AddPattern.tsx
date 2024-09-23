import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
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
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const addToSequence = async (channelId: number, patternId: number): Promise<void> => {
        const updatedChannel = {
            ...songData.channels[channelId],
            sequence: [
                ...songData.channels[channelId].sequence,
                patternId
            ],
        };

        const largestPatternId = songData.channels[channelId].patterns.length - 1;
        if (patternId > largestPatternId) {
            const type = services.vesProjectService.getProjectDataType('Audio');
            const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
            // @ts-ignore
            const newPattern = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.channels?.items?.properties?.patterns?.items);
            updatedChannel.patterns.push(newPattern);
        }

        setChannel(channelId, updatedChannel);
        setCurrentPatternId(channelId, patternId);
    };

    return <div
        className="addPattern"
    >
        <i className='codicon codicon-plus' />
        <div className='patternSelect'>
            <button
                className='newPattern'
                title={nls.localize('vuengine/musicEditor/addNewPattern', 'Add New Pattern')}
                onClick={() => addToSequence(channel.id, channel.patterns.length)}
            >
                <i className='codicon codicon-plus' />
            </button>
            <div className='existingPatterns'>
                {channel.patterns.map((pattern, patternId) => (
                    <button
                        key={patternId}
                        title={nls.localize('vuengine/musicEditor/addPatternX', 'Add Pattern {0}', patternId)}
                        onClick={() => addToSequence(channel.id, patternId)}
                    >
                        {patternId + 1}
                    </button>
                ))}
            </div>
        </div>
    </div>;
}
