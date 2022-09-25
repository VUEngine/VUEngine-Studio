import React from 'react';
import HContainer from '../../../../core/browser/components/HContainer';
import VContainer from '../../../../core/browser/components/VContainer';
import { MusicEditorStateApi, VOLUME_STEPS } from '../../ves-music-editor-types';

interface CurrentChannelProps {
    currentChannel: number
    stateApi: MusicEditorStateApi
}

export default function CurrentChannel(props: CurrentChannelProps): JSX.Element {
    const { currentChannel, /* stateApi */ } = props;

    return <div className='section currentChannel'>
        <VContainer>
            <label>Channel: {currentChannel}</label>
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
                <div style={{ minWidth: 10, width: 10 }}>
                    L
                </div>
                <input
                    type='range'
                    value={100}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    100
                </div>
            </HContainer>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    R
                </div>
                <input
                    type='range'
                    value={100}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    100
                </div>
            </HContainer>
        </VContainer>
    </div>;
}
