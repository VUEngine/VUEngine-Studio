import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import SectionSelect from '../../Common/SectionSelect';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
import { BAR_PATTERN_LENGTH_MULT_MAP, MAX_TICK_DURATION, MIN_TICK_DURATION, SoundData } from '../SoundEditorTypes';

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

    const setDefaultBar = (defaultBar: string): void => {
        updateSongData({ ...songData, defaultBar });
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
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/sound/songName', 'Song Name')}
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

        <VContainer>
            <label>
                <input
                    type="checkbox"
                    checked={songData.loop}
                    onChange={() => toggleLoop()}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
                {nls.localize('vuengine/editors/sound/loop', 'Loop')}
            </label>
        </VContainer>
        <VContainer grow={1}>
            <label>
                {nls.localize('vuengine/editors/sound/defaultBar', 'Default Bar')}
            </label>
            <AdvancedSelect
                options={Object.keys(BAR_PATTERN_LENGTH_MULT_MAP).map(v => ({
                    label: v,
                    value: v,
                }))}
                defaultValue={songData.defaultBar}
                onChange={options => setDefaultBar(options[0])}
                commands={INPUT_BLOCKING_COMMANDS}
            />
        </VContainer>
        <SectionSelect
            value={songData.section}
            setValue={setSection}
            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
        />
    </VContainer>;
}
