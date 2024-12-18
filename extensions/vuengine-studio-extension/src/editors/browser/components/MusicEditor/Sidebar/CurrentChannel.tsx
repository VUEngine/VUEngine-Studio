import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import BasicSelect from '../../Common/Base/BasicSelect';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
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

    const editInstrument = (): void => {
        setCurrentInstrument(channel.instrument);
        setSidebarTab(1);
    };

    return <VContainer gap={15}>
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
                    >
                        {songData.instruments.map((n, i) =>
                            <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                        )}
                    </select>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/musicEditor/editInstrument', 'Edit Instrument')}
                        onClick={editInstrument}
                    >
                        <i className='codicon codicon-settings-gear' />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>
            <VContainer>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={channel.muted}
                            onChange={() => toggleChannelMuted(channel.id)}
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
                        />
                        {nls.localize('vuengine/musicEditor/solo', 'Solo')}
                    </label>
                </VContainer>
            </VContainer>
        </HContainer>
    </VContainer>;
}
