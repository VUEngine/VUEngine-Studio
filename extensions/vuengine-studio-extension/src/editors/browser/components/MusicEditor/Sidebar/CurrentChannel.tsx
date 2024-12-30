import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import BasicSelect from '../../Common/Base/BasicSelect';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import HoverInfo from '../../Common/HoverInfo';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { ChannelConfig, SongData } from '../MusicEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentChannelProps {
    songData: SongData
    currentChannelId: number
    setCurrentChannelId: (channelId: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    setChannel: (channelId: number, channel: Partial<ChannelConfig>) => void
    setCurrentInstrument: Dispatch<SetStateAction<number>>
    setSidebarTab: Dispatch<SetStateAction<number>>
}

export default function CurrentChannel(props: CurrentChannelProps): React.JSX.Element {
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const {
        songData,
        currentChannelId, setCurrentChannelId,
        toggleChannelMuted,
        toggleChannelSolo,
        setChannel,
        setCurrentInstrument,
        setSidebarTab,
    } = props;

    const channel = songData.channels[currentChannelId];

    const setChannelInstrument = (instrument: number): void => {
        setChannel(currentChannelId, {
            instrument,
        });
    };

    const toggleChannelAllowSkip = (): void => {
        setChannel(currentChannelId, {
            allowSkip: !songData.channels[currentChannelId].allowSkip,
        });
    };

    const editInstrument = (): void => {
        setCurrentInstrument(channel.instrument);
        setSidebarTab(1);
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/musicEditor/currentChannel', 'Current Channel')}
                </label>
                <BasicSelect
                    options={[{
                        label: `1: ${nls.localize('vuengine/musicEditor/wave', 'Wave')} 1`,
                        value: 0,
                    }, {
                        label: `2: ${nls.localize('vuengine/musicEditor/wave', 'Wave')} 2`,
                        value: 1,
                    }, {
                        label: `3: ${nls.localize('vuengine/musicEditor/wave', 'Wave')} 3`,
                        value: 2,
                    }, {
                        label: `4: ${nls.localize('vuengine/musicEditor/wave', 'Wave')} 4`,
                        value: 3,
                    }, {
                        label: `5: ${nls.localize('vuengine/musicEditor/sweepModulation', 'Sweep / Modulation')}`,
                        value: 4,
                    }, {
                        label: `6: ${nls.localize('vuengine/musicEditor/noise', 'Noise')}`,
                        value: 5,
                    }]}
                    value={channel.id}
                    onChange={e => setCurrentChannelId(parseInt(e.target.value))}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>

            <HContainer alignItems='end' gap={20}>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/musicEditor/instrument', 'Instrument')}
                    </label>
                    <InputWithAction>
                        <select
                            className='theia-select'
                            onChange={e => setChannelInstrument(parseInt(e.target.value))}
                            value={channel.instrument}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        >
                            {songData.instruments.map((n, i) =>
                                <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                            )}
                        </select>
                        <InputWithActionButton
                            className='theia-button secondary'
                            title={nls.localize('vuengine/musicEditor/editInstrument', 'Edit Instrument')}
                            onClick={editInstrument}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        >
                            <i className='codicon codicon-settings-gear' />
                        </InputWithActionButton>
                    </InputWithAction>
                </VContainer>
            </HContainer>
            <HContainer gap={10} justifyContent='space-between'>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={channel.allowSkip}
                            onChange={() => toggleChannelAllowSkip()}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                        {nls.localize('vuengine/musicEditor/skip', 'Skip')}
                        <HoverInfo
                            value={nls.localize(
                                'vuengine/musicEditor/allowSkipDescription',
                                'Allow to skip notes during play back if no sound source is available when requested.'
                            )}
                        />
                    </label>
                </VContainer>
                <HContainer gap={10}>
                    <VContainer>
                        <label>
                            <input
                                type="checkbox"
                                checked={channel.muted}
                                onChange={() => toggleChannelMuted(channel.id)}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            {nls.localize('vuengine/musicEditor/muted', 'Muted')}
                        </label>
                    </VContainer>
                    <VContainer>
                        <label>
                            <input
                                type="checkbox"
                                checked={channel.solo}
                                onChange={() => toggleChannelSolo(channel.id)}
                                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                            />
                            {nls.localize('vuengine/musicEditor/solo', 'Solo')}
                        </label>
                    </VContainer>
                </HContainer>
            </HContainer>
        </VContainer>
    );
}
