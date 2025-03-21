import { nls, QuickPickItem, QuickPickOptions, QuickPickSeparator } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import { StyledAddPatternButton } from './StyledComponents';

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

    const showPatternSelection = async (): Promise<QuickPickItem | undefined> => services.quickPickService.show(
        [
            {
                id: `${channel.patterns.length}`,
                label: nls.localize('vuengine/editors/music/newPattern', 'New Pattern'),
            },
            ...channel.patterns.map((p, i) => ({
                id: `${i}`,
                label: `${i + 1}`,
                description: p.name,
            })),
        ],
        {
            title: nls.localize('vuengine/editors/music/addPattern', 'Add Pattern'),
            placeholder: nls.localize('vuengine/editors/music/selectPatternToAdd', 'Select a pattern to add...'),
        }
    );

    const addPattern = async (): Promise<void> => {
        const patternToAdd = await showPatternSelection();
        if (patternToAdd && patternToAdd.id) {
            addToSequence(channel.id, parseInt(patternToAdd.id));
        }
    };

    return (
        <StyledAddPatternButton
            title={nls.localizeByDefault('Add')}
            onClick={addPattern}
        >
            <i className='codicon codicon-plus' />
        </StyledAddPatternButton>
    );
}
