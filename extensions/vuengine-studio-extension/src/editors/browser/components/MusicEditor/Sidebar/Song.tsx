import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { MAX_SPEED, MIN_SPEED, PATTERN_SIZES, SongData, VOLUME_STEPS } from '../MusicEditorTypes';

interface SongProps {
    songData: SongData
    setSongData: (songData: SongData) => void
}

export default function Song(props: SongProps): React.JSX.Element {
    const { songData, setSongData } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setName = (n: string): void => {
        setSongData({ ...songData, name: n });
    };

    const setBar = (b: number): void => {
        setSongData({ ...songData, bar: b });
    };

    const setSpeed = (s: number): void => {
        if (s <= MAX_SPEED && s >= MIN_SPEED) {
            setSongData({ ...songData, speed: s });
        }
    };

    const setVolume = (v: number): void => {
        if (v <= 100 && v >= 0) {
            setSongData({ ...songData, volume: v });
        }
    };

    const setDefaultPatternSize = (size: number): void => {
        setSongData({
            ...songData,
            defaultPatternSize: size,
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/songName', 'Song Name')}
            </label>
            <input
                className='theia-input'
                value={songData.name}
                onChange={e => setName(e.target.value)}
                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
            />
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/masterVolume', 'Master Volume')}
            </label>
            <HContainer>
                <input
                    type='range'
                    value={songData.volume}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setVolume(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {songData.volume}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/bpm', 'BPM')}
            </label>
            <HContainer>
                <input
                    type='range'
                    value={songData.speed}
                    max={MAX_SPEED}
                    min={MIN_SPEED}
                    step={10}
                    onChange={e => setSpeed(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {songData.speed}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/bar', 'Bar')}
            </label>
            <HContainer>
                <input
                    type='range'
                    value={songData.bar}
                    max={16}
                    min={2}
                    step={2}
                    onChange={e => setBar(parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {songData.bar}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            {nls.localize('vuengine/musicEditor/defaultPatternSize', 'Default Pattern Size')}
            <RadioSelect
                options={PATTERN_SIZES.map(size => ({ value: size }))}
                defaultValue={songData.defaultPatternSize}
                onChange={options => setDefaultPatternSize(options[0].value as number)}
            />
        </VContainer>
    </VContainer>;
}
