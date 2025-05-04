import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import SectionSelect from '../../Common/SectionSelect';
import { INPUT_BLOCKING_COMMANDS, MAX_PATTERN_SIZE, MAX_TICK_DURATION, MIN_PATTERN_SIZE, MIN_TICK_DURATION, SoundData } from '../SoundEditorTypes';

interface SongProps {
    songData: SoundData
    updateSongData: (songData: SoundData) => void
}

export default function Song(props: SongProps): React.JSX.Element {
    const { songData, updateSongData } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setName = (n: string): void => {
        updateSongData({ ...songData, name: n });
    };

    const setDefaultSize = (defaultSize: number): void => {
        updateSongData({ ...songData, defaultSize });
    };

    const setLoopPoint = (loopPoint: number): void => {
        updateSongData({ ...songData, loopPoint });
    };

    const setSection = (section: DataSection): void => {
        updateSongData({ ...songData, section });
    };

    const toggleLoop = (): void => {
        updateSongData({ ...songData, loop: !songData.loop });
    };

    const setTickDuration = (s: number): void => {
        if (s <= MAX_TICK_DURATION && s >= MIN_TICK_DURATION) {
            updateSongData({ ...songData, speed: s });
        }
    };

    return <VContainer gap={15}>
        <Input
            label={nls.localize('vuengine/editors/sound/songName', 'Song Name')}
            value={songData.name}
            setValue={v => setName(v as string)}
            commands={INPUT_BLOCKING_COMMANDS}
        />

        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/tickDurationMs', 'Tick duration (in milliseconds)')}
            </label>
            <Range
                value={songData.speed}
                max={MAX_TICK_DURATION}
                min={MIN_TICK_DURATION}
                setValue={(v: number) => setTickDuration(v)}
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
                    checked={songData.loop}
                    onChange={() => toggleLoop()}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            {songData.loop &&
                <Input
                    label={nls.localize('vuengine/editors/sound/loopPoint', 'LoopPoint')}
                    value={songData.loopPoint}
                    setValue={v => setLoopPoint(v as number)}
                    type='number'
                    min={0}
                    max={512}
                    width={64}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
            }
        </HContainer>
        <Input
            label={nls.localize('vuengine/editors/sound/defaultPatternSize', 'Default Pattern Size')}
            value={songData.defaultSize}
            setValue={v => setDefaultSize(v as number)}
            type='number'
            min={MIN_PATTERN_SIZE}
            max={MAX_PATTERN_SIZE}
            width={64}
            commands={INPUT_BLOCKING_COMMANDS}
        />
        <SectionSelect
            value={songData.section}
            setValue={setSection}
            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
        />
    </VContainer >;
}
