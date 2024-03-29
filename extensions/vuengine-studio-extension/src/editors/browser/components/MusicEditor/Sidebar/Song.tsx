import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { MAX_SPEED, MIN_SPEED, MusicEditorContext, MusicEditorContextType, PATTERN_SIZES, VOLUME_STEPS } from '../MusicEditorTypes';
import RadioSelect from '../../Common/RadioSelect';

export default function Song(): React.JSX.Element {
    const { songData, setSongData } = useContext(MusicEditorContext) as MusicEditorContextType;

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

    return <VContainer gap={10}>
        <VContainer>
            <label>Song Name</label>
            <input
                className='theia-input'
                value={songData.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>

        <VContainer>
            <label>Master Volume</label>
            <HContainer>
                <input
                    type='range'
                    value={songData.volume}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setVolume(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {songData.volume}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>BPM</label>
            <HContainer>
                <input
                    type='range'
                    value={songData.speed}
                    max={MAX_SPEED}
                    min={MIN_SPEED}
                    step={10}
                    onChange={e => setSpeed(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {songData.speed}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>Bar</label>
            <HContainer>
                <input
                    type='range'
                    value={songData.bar}
                    max={16}
                    min={2}
                    step={2}
                    onChange={e => setBar(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {songData.bar}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            Default Pattern Size
            <RadioSelect
                options={PATTERN_SIZES.map(size => ({ value: size }))}
                defaultValue={songData.defaultPatternSize}
                onChange={options => setDefaultPatternSize(options[0].value as number)}
            />
        </VContainer>
    </VContainer>;
}
