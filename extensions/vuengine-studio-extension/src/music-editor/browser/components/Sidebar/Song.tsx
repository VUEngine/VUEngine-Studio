import React from 'react';
import HContainer from '../../../../core/browser/components/HContainer';
import VContainer from '../../../../core/browser/components/VContainer';
import { MAX_SPEED, MIN_SPEED, MusicEditorStateApi, VOLUME_STEPS } from '../../ves-music-editor-types';

interface SongProps {
    name: string
    volume: number
    speed: number
    bar: number
    stateApi: MusicEditorStateApi
}

export default function Song(props: SongProps): JSX.Element {
    const { name, volume, speed, bar, stateApi } = props;

    return <div className='section first song'>
        <VContainer>
            <label>Song Name</label>
            <input
                className='theia-input'
                value={name}
                onChange={e => stateApi.setName(e.target.value)}
            />
        </VContainer>

        <VContainer>
            <label>Master Volume</label>
            <HContainer>
                <input
                    type='range'
                    value={volume}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => stateApi.setVolume(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {volume}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>BPM</label>
            <HContainer>
                <input
                    type='range'
                    value={speed}
                    max={MAX_SPEED}
                    min={MIN_SPEED}
                    step={10}
                    onChange={e => stateApi.setSpeed(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {speed}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>Bar</label>
            <HContainer>
                <input
                    type='range'
                    value={bar}
                    max={16}
                    min={2}
                    step={2}
                    onChange={e => stateApi.setBar(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {bar}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            Default Pattern Size
            <select
                className='theia-select'
                value={32}
            >
                <option value={16}>16</option>
                <option value={32}>32</option>
                <option value={64}>64</option>
            </select>
        </VContainer>
    </div>;
}
