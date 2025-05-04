import { nls, QuickPickItem } from '@theia/core';
import React, { useContext, useEffect } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { ChannelConfig, SoundData } from '../SoundEditorTypes';
import { StyledAddPatternButton } from './StyledComponents';
import { SoundEditorCommands } from '../SoundEditorCommands';

interface AddPatternProps {
    songData: SoundData
    channel: ChannelConfig
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    setCurrentPatternId: (channel: number, patternId: number) => void
}

export default function AddPattern(props: AddPatternProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { songData, channel, setChannel, setCurrentPatternId } = props;

    const addPatternToSequence = async (channelId: number, patternId: number): Promise<void> => {
        const updatedChannel = {
            ...songData.channels[channelId],
            sequence: [
                ...songData.channels[channelId].sequence,
                patternId
            ],
        };

        // create if it's a new pattern
        const largestPatternId = songData.channels[channelId].patterns.length - 1;
        if (patternId > largestPatternId) {
            const type = services.vesProjectService.getProjectDataType('Sound');
            const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
            // @ts-ignore
            const newPattern = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.channels?.items?.properties?.patterns?.items);
            updatedChannel.patterns.push({
                ...newPattern,
                size: songData.defaultSize,
            });
        }

        setChannel(channelId, updatedChannel);
        setCurrentPatternId(channelId, patternId);
    };

    const showPatternSelection = async (): Promise<QuickPickItem | undefined> => services.quickPickService.show(
        [
            {
                id: `${channel.patterns.length}`,
                label: nls.localize('vuengine/editors/sound/newPattern', 'New Pattern'),
            },
            ...channel.patterns.map((p, i) => ({
                id: i.toString(),
                label: p.name.length ? p.name : (i + 1).toString(),
            })),
        ],
        {
            title: nls.localize('vuengine/editors/sound/addPattern', 'Add Pattern'),
            placeholder: nls.localize('vuengine/editors/sound/selectPatternToAdd', 'Select a pattern to add...'),
        }
    );

    const addPattern = async (): Promise<void> => {
        const patternToAdd = await showPatternSelection();
        if (patternToAdd && patternToAdd.id) {
            addPatternToSequence(channel.id, parseInt(patternToAdd.id));
        }
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.ADD_PATTERN.id:
                addPattern();
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    return (
        <StyledAddPatternButton
            title={nls.localizeByDefault('Add')}
            onClick={addPattern}
        >
            <i className='codicon codicon-plus' />
        </StyledAddPatternButton>
    );
}
