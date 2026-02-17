import { Trash } from '@phosphor-icons/react';
import { deepClone, nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import Checkbox from '../../Common/Base/Checkbox';
import HContainer from '../../Common/Base/HContainer';
import Range from '../../Common/Base/Range';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { clamp } from '../../Common/Utils';
import { VSU_NUMBER_OF_CHANNELS } from '../Emulator/VsuTypes';
import { InputWithAction, InputWithActionButton } from '../Instruments/Instruments';
import { getInstrumentLabel, getTrackTypeLabel } from '../SoundEditor';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    SoundData,
    SoundEditorTrackType,
    TRACK_PRIORITY_DEFAULT,
    TRACK_PRIORITY_MAX,
    TRACK_PRIORITY_MIN,
    TRACK_TYPE_INSTRUMENT_COMPATIBILITY,
    TRACK_TYPE_LABELS,
    TrackConfig
} from '../SoundEditorTypes';

interface CurrentTrackProps {
    soundData: SoundData
    setSoundData: Dispatch<SetStateAction<SoundData>>
    currentTrackId: number
    setCurrentTrackId: (id: number) => void
    setTrack: (trackId: number, track: Partial<TrackConfig>) => void
    removeTrack: (trackId: number) => void
    editInstrument: (instrument: string) => void
    isTrackAvailable: (trackType: SoundEditorTrackType, tracks: TrackConfig[]) => boolean
}

export default function CurrentTrack(props: CurrentTrackProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData, setSoundData,
        currentTrackId, setCurrentTrackId,
        setTrack, removeTrack,
        editInstrument,
        isTrackAvailable,
    } = props;

    const track = soundData.tracks[currentTrackId];

    const onSelectTrack = (trackId: number): void =>
        setCurrentTrackId(trackId);

    const setTrackInstrument = (instrumentId: string): void =>
        setTrack(currentTrackId, { instrument: instrumentId });

    const setPriority = (priority: number): void =>
        setTrack(currentTrackId, {
            priority: clamp(
                priority,
                TRACK_PRIORITY_MIN,
                TRACK_PRIORITY_MAX,
                TRACK_PRIORITY_DEFAULT,
            )
        });

    const setTrackType = (type: SoundEditorTrackType): void =>
        setSoundData({
            ...soundData,
            tracks: soundData.tracks
                .map((t, i) => ({
                    ...t,
                    type: i === currentTrackId ? type : t.type,
                }))
                .sort((a, b) => b.type.localeCompare(a.type)),
        });

    const toggleTrackSkippable = (): void =>
        setTrack(currentTrackId, {
            skippable: !soundData.tracks[currentTrackId].skippable,
        });

    return (
        <VContainer gap={20}>
            {track && <>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/currentTrack', 'Current Track')}
                    </label>
                    <InputWithAction>
                        <AdvancedSelect
                            options={deepClone(soundData.tracks).map((c, i) => {
                                switch (c.type) {
                                    default:
                                    case SoundEditorTrackType.WAVE:
                                        return {
                                            label: `${TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE]} ${i + 1}`,
                                            value: i.toString(),
                                        };
                                    case SoundEditorTrackType.SWEEPMOD:
                                        return {
                                            label: TRACK_TYPE_LABELS[SoundEditorTrackType.SWEEPMOD],
                                            value: i.toString(),
                                        };
                                    case SoundEditorTrackType.NOISE:
                                        return {
                                            label: TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE],
                                            value: i.toString(),
                                        };
                                }
                            })}
                            defaultValue={`${currentTrackId}`}
                            onChange={options => onSelectTrack(parseInt(options[0]))}
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
                            onClick={() => services.commandService.executeCommand(SoundEditorCommands.ADD_TRACK.id)}
                            title={`${SoundEditorCommands.ADD_TRACK.label}${services.vesCommonService.getKeybindingLabel(
                                SoundEditorCommands.ADD_TRACK.id,
                                true
                            )}`}
                            disabled={soundData.tracks.length === VSU_NUMBER_OF_CHANNELS}
                        >
                            <i className='codicon codicon-plus' />
                        </InputWithActionButton>
                    </InputWithAction>
                </VContainer>

                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/type', 'Type')}
                    </label>
                    <AdvancedSelect
                        options={[
                            SoundEditorTrackType.WAVE,
                            SoundEditorTrackType.SWEEPMOD,
                            SoundEditorTrackType.NOISE,
                        ]
                            .filter(type => type === track.type || isTrackAvailable(type, soundData.tracks))
                            .map(type => ({
                                value: type,
                                label: getTrackTypeLabel(type),
                            }))}
                        defaultValue={`${track.type}`}
                        onChange={options => setTrackType(options[0] as SoundEditorTrackType)}
                    />
                </VContainer>

                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/defaultInstrument', 'Default Instrument')}
                    </label>
                    <InputWithAction>
                        <AdvancedSelect
                            options={Object.keys(soundData.instruments)
                                .filter(instrumentId => {
                                    const instrument = soundData.instruments[instrumentId];
                                    return TRACK_TYPE_INSTRUMENT_COMPATIBILITY[track.type].includes(instrument.type);
                                })
                                .sort((a, b) => soundData.instruments[a].name.localeCompare(soundData.instruments[b].name))
                                .map((instrumentId, i) => {
                                    const instrument = soundData.instruments[instrumentId];
                                    return {
                                        value: `${instrumentId}`,
                                        label: getInstrumentLabel(soundData, instrumentId),
                                        backgroundColor: COLOR_PALETTE[instrument.color ?? DEFAULT_COLOR_INDEX],
                                    };
                                })}
                            defaultValue={`${track.instrument}`}
                            onChange={options => setTrackInstrument(options[0])}
                            backgroundColor={soundData.instruments[track.instrument] ? COLOR_PALETTE[soundData.instruments[track.instrument].color] : undefined}
                            borderColor={soundData.instruments[track.instrument] ? COLOR_PALETTE[soundData.instruments[track.instrument].color] : undefined}
                            maxMenuHeight={115}
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

                <HContainer gap={10}>
                    <VContainer grow={1}>
                        <InfoLabel
                            label={nls.localize('vuengine/editors/sound/priority', 'Priority')}
                            tooltip={nls.localize(
                                'vuengine/editors/sound/priorityDescription',
                                'If no sound source is available when a note of this track is requested, \
it can steal the sound source from a lower priority track (if "Skip" is not enabled). \
If a track has the highest priority, but all sound sources are used by other tracks with the highest priority, \
then notes of the former are queued (if "Skip" is not enabled).'
                            )}
                        />
                        <Range
                            value={track.priority}
                            min={TRACK_PRIORITY_MIN}
                            max={TRACK_PRIORITY_MAX}
                            setValue={setPriority}
                        />
                    </VContainer>
                    <Checkbox
                        label={nls.localize('vuengine/editors/sound/skip', 'Skip')}
                        tooltip={nls.localize(
                            'vuengine/editors/sound/skipDescription',
                            'If no sound source is available when a note of this track is requested, \
do not queue, but skip it.'
                        )}
                        checked={track.skippable}
                        setChecked={toggleTrackSkippable}
                    />
                </HContainer>
            </>}
        </VContainer>
    );
}
