import { Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { TrackConfig, INPUT_BLOCKING_COMMANDS, SoundData, SoundEditorTrackType } from '../SoundEditorTypes';
import { InputWithAction, InputWithActionButton } from './Instruments';

interface CurrentTrackProps {
    soundData: SoundData
    currentTrackId: number
    setCurrentTrackId: Dispatch<SetStateAction<number>>
    setCurrentPatternId: Dispatch<SetStateAction<string>>
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    removeTrack: (trackId: number) => void
    editInstrument: (instrument: string) => void
}

export default function CurrentTrack(props: CurrentTrackProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        currentTrackId, setCurrentTrackId,
        setCurrentPatternId,
        setTrack, removeTrack,
        editInstrument,
    } = props;

    const track = soundData.tracks[currentTrackId];

    const onSelectTrack = (trackId: number): void => {
        setCurrentTrackId(trackId);
        setCurrentPatternId(Object.values(soundData.tracks[trackId].sequence)[0] ?? '');
    };

    const setTrackInstrument = (instrumentId: string): void => {
        setTrack(currentTrackId, {
            instrument: instrumentId,
        });
    };

    const toggleTrackAllowSkip = (): void => {
        setTrack(currentTrackId, {
            allowSkip: !soundData.tracks[currentTrackId].allowSkip,
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/currentTrack', 'Current Track')}
                </label>
                <InputWithAction>
                    <AdvancedSelect
                        options={[...soundData.tracks.map((c, i) => {
                            switch (c.type) {
                                default:
                                case SoundEditorTrackType.WAVE:
                                    return {
                                        label: `${nls.localize('vuengine/editors/sound/wave', 'Wave')} ${i + 1}`,
                                        value: i.toString(),
                                    };
                                case SoundEditorTrackType.SWEEPMOD:
                                    return {
                                        label: nls.localize('vuengine/editors/sound/waveSm', 'Wave (Sweep / Modulation)'),
                                        value: i.toString(),
                                    };
                                case SoundEditorTrackType.NOISE:
                                    return {
                                        label: nls.localize('vuengine/editors/sound/noise', 'Noise'),
                                        value: i.toString(),
                                    };
                            }
                        })]}
                        defaultValue={`${currentTrackId}`}
                        onChange={options => onSelectTrack(parseInt(options[0]))}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Remove')}
                        onClick={() => removeTrack(currentTrackId)}
                    >
                        <Trash size={16} />
                    </InputWithActionButton>
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localizeByDefault('Add')}
                        onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_TRACK.id)}
                        disabled={soundData.tracks.length === VSU_NUMBER_OF_CHANNELS}
                    >
                        <i className='codicon codicon-plus' />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>

            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/sound/defaultInstrument', 'Default Instrument')}
                </label>
                <InputWithAction>
                    <AdvancedSelect
                        options={Object.keys(soundData.instruments)
                            .sort((a, b) => soundData.instruments[a].name.localeCompare(soundData.instruments[b].name))
                            .map((instrumentId, i) => {
                                const instrument = soundData.instruments[instrumentId];
                                return {
                                    value: `${instrumentId}`,
                                    label: instrument.name.length ? instrument.name : (i + 1).toString(),
                                    backgroundColor: COLOR_PALETTE[instrument.color ?? DEFAULT_COLOR_INDEX],
                                };
                            })}
                        defaultValue={`${track.instrument}`}
                        onChange={options => setTrackInstrument(options[0])}
                        commands={INPUT_BLOCKING_COMMANDS}
                    />
                    <InputWithActionButton
                        className='theia-button secondary'
                        title={nls.localize('vuengine/editors/sound/editInstrument', 'Edit Instrument')}
                        onClick={() => editInstrument(track.instrument)}
                    >
                        <i className='codicon codicon-settings-gear' />
                    </InputWithActionButton>
                </InputWithAction>
            </VContainer>

            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/sound/lowPriority', 'Low Priority')}
                    tooltip={nls.localize(
                        'vuengine/editors/sound/allowSkipDescription',
                        'Allow to skip notes of this track during play back, \
if no other sound source is available when requested by e.g. a sound effect.'
                    )}
                />
                <input
                    type="checkbox"
                    checked={track.allowSkip}
                    onChange={() => toggleTrackAllowSkip()}
                />
            </VContainer>
        </VContainer>
    );
}
