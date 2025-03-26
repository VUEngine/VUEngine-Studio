import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import { DataSection } from '../../Common/CommonTypes';
import InfoLabel from '../../Common/InfoLabel';
import SectionSelect from '../../Common/SectionSelect';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
import { BAR_PATTERN_LENGTH_MULT_MAP, MAX_TICK_DURATION, MIN_TICK_DURATION, NoteResolution, SoundData } from '../SoundEditorTypes';

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

    const setNoteResolution = (noteResolution: number): void => {
        // TODO: we also need to adjust patterns when changing resolution.
        // add notes when selecting a larger resolution
        // remove notes when selecting a smaller resolution
        // TODO: we need a confirm dialog explaining the consequences
        // show number of notes which would be deleted

        updateSongData({ ...songData, noteResolution });
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

        <HContainer gap={15}>
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
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/sound/noteResolution', 'Note Resolution')}
                    tooltip={nls.localize(
                        'vuengine/editors/sound/noteResolutionDescription',
                        'This defines the length of every single note in this song, \
or, in other words, the amount of notes per whole tone segment. \
The higher the value, the more detailed sound you can create, \
but also the higher the required storage space. '
                    )}
                />
                <RadioSelect
                    options={[{
                        label: '1/4',
                        value: NoteResolution.QUARTER,
                    }, {
                        label: '1/8',
                        value: NoteResolution.EIGHTH,
                    }, {
                        label: '1/16',
                        value: NoteResolution.SIXTEENTH,
                    }, {
                        label: '1/32',
                        value: NoteResolution.THIRTYSECOND,
                    }]}
                    defaultValue={songData.noteResolution}
                    onChange={options => setNoteResolution(options[0].value as number)}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
        </HContainer>
        <SectionSelect
            value={songData.section}
            setValue={setSection}
            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
        />
    </VContainer>;
}
