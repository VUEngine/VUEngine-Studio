import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS, MAX_SEQUENCE_SIZE, MAX_TICK_DURATION, MIN_TICK_DURATION, SoundData } from '../SoundEditorTypes';

interface SongProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
}

export default function Song(props: SongProps): React.JSX.Element {
    const { soundData, updateSoundData } = props;

    const setName = (n: string): void => {
        updateSoundData({ ...soundData, name: n });
    };

    const setLoopPoint = (loopPoint: number): void => {
        updateSoundData({ ...soundData, loopPoint });
    };

    /*
    const setSection = (section: DataSection): void => {
        updateSoundData({ ...soundData, section });
    };
    */

    const toggleLoop = (): void => {
        updateSoundData({ ...soundData, loop: !soundData.loop });
    };

    const setSpeed = (s: number): void => {
        if (s <= MAX_TICK_DURATION && s >= MIN_TICK_DURATION) {
            updateSoundData({ ...soundData, speed: s });
        }
    };

    return <VContainer gap={15}>
        <Input
            label={nls.localize('vuengine/editors/sound/songName', 'Song Name')}
            value={soundData.name}
            setValue={setName}
            commands={INPUT_BLOCKING_COMMANDS}
        />

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/sixteenthNoteDurationMs', '1/16 note duration (in milliseconds)')}
            </label>
            <Range
                value={soundData.speed}
                max={MAX_TICK_DURATION}
                min={MIN_TICK_DURATION}
                setValue={setSpeed}
                commandsToDisable={INPUT_BLOCKING_COMMANDS}
            />
        </VContainer>

        <HContainer gap={20}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/loop', 'Loop')}
                </label>
                <input
                    type="checkbox"
                    checked={soundData.loop}
                    onChange={() => toggleLoop()}
                />
            </VContainer>
            {soundData.loop &&
                <Input
                    label={nls.localize('vuengine/editors/sound/loopPoint', 'LoopPoint')}
                    value={soundData.loopPoint}
                    setValue={setLoopPoint}
                    type='number'
                    min={0}
                    max={MAX_SEQUENCE_SIZE - 1}
                    width={64}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            }
        </HContainer>
        { /* }
        <SectionSelect
            value={soundData.section}
            setValue={setSection}
        />
        { */ }
    </VContainer >;
}
