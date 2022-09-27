import React from 'react';
import HContainer from '../../../../core/browser/components/HContainer';
import VContainer from '../../../../core/browser/components/VContainer';
import { ChannelConfig, MusicEditorStateApi, VOLUME_STEPS } from '../../ves-music-editor-types';

interface CurrentChannelProps {
    channel: ChannelConfig
    stateApi: MusicEditorStateApi
}

export default function CurrentChannel(props: CurrentChannelProps): JSX.Element {
    const { channel, stateApi } = props;

    return <div className='section currentChannel'>
        <VContainer>
            <label>Channel: {channel.id + 1}</label>
        </VContainer>

        <VContainer>
            Instrument
            <select
                className='theia-select'
            >
                <option value={0}>Synth</option>
            </select>
        </VContainer>

        <VContainer>
            <label>Envelope Volume</label>
            <HContainer>
                <input
                    type='range'
                    value={channel.volume}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => stateApi.setChannelVolume(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {channel.volume}
                </div>
            </HContainer>
        </VContainer>
    </div>;
}
