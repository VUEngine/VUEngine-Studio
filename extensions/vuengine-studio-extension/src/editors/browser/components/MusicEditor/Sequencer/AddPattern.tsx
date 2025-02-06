import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import { StyledAddPattern, StyledAddPatternButton, StyledAddPatternExisting, StyledAddPatternNewPatternButton, StyledAddPatternPatternSelect } from './StyledComponents';

interface AddPatternProps {
    songData: SongData
    channel: ChannelConfig
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    setCurrentPatternId: (channel: number, patternId: number) => void
}

export default function AddPattern(props: AddPatternProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { songData, channel, setChannel, setCurrentPatternId } = props;

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

    return (
        <StyledAddPattern>
            <i className='codicon codicon-plus' />
            <StyledAddPatternPatternSelect>
                <StyledAddPatternNewPatternButton
                    title={nls.localizeByDefault('Add')}
                    onClick={() => addToSequence(channel.id, channel.patterns.length)}
                >
                    <i className='codicon codicon-plus' />
                </StyledAddPatternNewPatternButton>
                <StyledAddPatternExisting>
                    {channel.patterns.map((pattern, patternId) => (
                        <StyledAddPatternButton
                            key={patternId}
                            title={nls.localize('vuengine/editors/music/addPatternX', 'Add Pattern {0}', patternId)}
                            onClick={() => addToSequence(channel.id, patternId)}
                        >
                            {patternId + 1}
                        </StyledAddPatternButton>
                    ))}
                </StyledAddPatternExisting>
            </StyledAddPatternPatternSelect>
        </StyledAddPattern>
    );
}
