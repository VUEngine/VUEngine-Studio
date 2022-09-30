import React from 'react';
import HContainer from '../../../../../core/browser/components/HContainer';
import VContainer from '../../../../../core/browser/components/VContainer';
import { MAX_SPEED, MIN_SPEED, PATTERN_SIZES, SongData, VOLUME_STEPS } from '../MusicEditorTypes';

interface SongProps {
    name: string
    volume: number
    speed: number
    bar: number
    defaultPatternSize: number
    setSongData: (songData: Partial<SongData>) => void
}

export default function Song(props: SongProps): JSX.Element {
    const { name, volume, speed, bar, defaultPatternSize, setSongData } = props;

    const setName = (n: string): void => {
        setSongData({ name: n });
    };

    const setBar = (b: number): void => {
        setSongData({ bar: b });
    };

    const setSpeed = (s: number): void => {
        if (s <= MAX_SPEED && s >= MIN_SPEED) {
            setSongData({ speed: s });
        }
    };

    const setVolume = (v: number): void => {
        if (v <= 100 && v >= 0) {
            setSongData({ volume: v });
        }
    };

    const setDefaultPatternSize = (size: number): void => {
        setSongData({
            defaultPatternSize: size,
        });
    };

    return <div className='section song'>
        <VContainer>
            <label>Song Name</label>
            <input
                className='theia-input'
                value={name}
                onChange={e => setName(e.target.value)}
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
                    onChange={e => setVolume(parseInt(e.target.value))}
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
                    onChange={e => setSpeed(parseInt(e.target.value))}
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
                    onChange={e => setBar(parseInt(e.target.value))}
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
                value={defaultPatternSize}
                onChange={e => setDefaultPatternSize(parseInt(e.target.value))}
            >
                {PATTERN_SIZES.map(size =>
                    <option key={`default-pattern-size-option-${size}`} value={size}>{size}</option>
                )}
            </select>
        </VContainer>
    </div>;
}
