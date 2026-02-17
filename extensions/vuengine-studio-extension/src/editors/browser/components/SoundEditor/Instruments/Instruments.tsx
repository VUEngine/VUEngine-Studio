import { Waveform, WaveSawtooth, WaveSine } from '@phosphor-icons/react';
import { deepClone, nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { SoundType } from '../../../../../project/browser/types/Sound';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import EmptyContainer from '../../Common/EmptyContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { nanoid } from '../../Common/Utils';
import { getInstrumentLabel, getInstrumentName } from '../SoundEditor';
import {
    InstrumentConfig,
    InstrumentMap,
    NOTES_LABELS_REVERSED,
    SoundData,
    SoundEditorTrackType,
    TRACK_DEFAULT_INSTRUMENT_ID,
    TRACK_TYPE_LABELS
} from '../SoundEditorTypes';
import Instrument from './Instrument';

export const InputWithAction = styled.div`
    display: flex;
    gap: 5px;

    :first-child {
        flex-grow: 1;
    }
`;

export const InputWithActionButton = styled.button`
    align-items: center;
    display: flex;
    justify-content: center;
    margin: 0;
    min-width: 26px !important;
    padding: 0;
    width: 26px;
`;

interface InstrumentsProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentEditedInstrumentId: string
    setCurrentEditedInstrumentId: Dispatch<SetStateAction<string>>
    setInstruments: (instruments: InstrumentMap) => void
    setWaveformDialogOpen: Dispatch<SetStateAction<string>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<string>>
    setInstrumentColorDialogOpen: Dispatch<SetStateAction<string>>
    playingTestNote: boolean
    playNote: (note: string, instrumentId?: string) => void
    emulatorInitialized: boolean
    setForcePlayerRomRebuild: Dispatch<SetStateAction<number>>
}

export default function Instruments(props: InstrumentsProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentEditedInstrumentId, setCurrentEditedInstrumentId,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen, setInstrumentColorDialogOpen,
        playingTestNote,
        playNote,
        emulatorInitialized,
        setForcePlayerRomRebuild,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [typeFilter, setTypeFilter] = useState<SoundEditorTrackType[]>([
        SoundEditorTrackType.WAVE,
        SoundEditorTrackType.SWEEPMOD,
        SoundEditorTrackType.NOISE
    ]);
    const [testNote, setTestNote] = useState<string>(NOTES_LABELS_REVERSED[24]);

    const currentEditedInstrument = soundData.instruments[currentEditedInstrumentId];

    const addInstrument = async () => {
        const schema = await window.electronVesCore.dereferenceJsonSchema(SoundType.schema);
        const newInstrument = services.vesProjectService.generateDataFromJsonSchema(schema.properties?.instruments?.additionalProperties) as InstrumentConfig;
        if (!newInstrument) {
            return;
        }

        const newId = nanoid();
        const newNameLabel = nls.localizeByDefault('New');
        let newNameNumber = 1;
        const instruments = Object.values(soundData.instruments);
        while (instruments.filter(i => i.name === `${newNameLabel} ${newNameNumber}`).length) {
            newNameNumber++;
        }

        updateSoundData({
            ...soundData,
            instruments: {
                ...soundData.instruments,
                [newId]: {
                    ...newInstrument,
                    name: `${newNameLabel} ${newNameNumber}`,
                },
            },
            tracks: deepClone(soundData.tracks).map(t => {
                if (t.type === newInstrument.type && t.instrument === '') {
                    t.instrument = newId;
                }
                return t;
            })
        });
        setCurrentEditedInstrumentId(newId);
    };

    useEffect(() => {
        if (playingTestNote) {
            playNote(testNote, currentEditedInstrumentId);
        }
    }, [currentEditedInstrumentId]);

    return Object.keys(soundData.instruments).length > 0
        ? (
            <VContainer gap={20} grow={1}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/selectInstrument', 'Select Instrument')}
                    </label>
                    <HContainer>
                        <RadioSelect
                            options={[{
                                label: <WaveSine size={16} />,
                                tooltip: TRACK_TYPE_LABELS[SoundEditorTrackType.WAVE],
                                value: SoundEditorTrackType.WAVE,
                            }, {
                                label: <WaveSawtooth size={16} />,
                                tooltip: TRACK_TYPE_LABELS[SoundEditorTrackType.SWEEPMOD],
                                value: SoundEditorTrackType.SWEEPMOD,
                            }, {
                                label: <Waveform size={16} />,
                                tooltip: TRACK_TYPE_LABELS[SoundEditorTrackType.NOISE],
                                value: SoundEditorTrackType.NOISE,
                            }]}
                            canSelectMany={true}
                            allowBlank={false}
                            defaultValue={typeFilter}
                            onChange={options => setTypeFilter(options.map(o => o.value) as SoundEditorTrackType[])}
                            fitSpace
                        />
                        <AdvancedSelect
                            options={[
                                ...Object.keys(soundData.instruments)
                                    .filter(instrumentId => {
                                        const instrument = soundData.instruments[instrumentId];
                                        return typeFilter.includes(instrument.type);
                                    })
                                    // sort alphabetically, empty names to end
                                    .sort((a, b) => (soundData.instruments[a].name.length ? soundData.instruments[a].name : 'zzz').localeCompare(
                                        (soundData.instruments[b].name.length ? soundData.instruments[b].name : 'zzz')
                                    ))
                                    .map((instrumentId, i) => {
                                        const instr = soundData.instruments[instrumentId];
                                        return {
                                            value: `${instrumentId}`,
                                            label: getInstrumentLabel(soundData, instrumentId),
                                            backgroundColor: COLOR_PALETTE[instr.color ?? DEFAULT_COLOR_INDEX],
                                        };
                                    })
                            ]}
                            title={getInstrumentName(soundData, currentEditedInstrumentId ?? TRACK_DEFAULT_INSTRUMENT_ID)}
                            defaultValue={currentEditedInstrumentId}
                            onChange={options => setCurrentEditedInstrumentId(options[0])}
                            backgroundColor={currentEditedInstrument ? COLOR_PALETTE[currentEditedInstrument.color] : undefined}
                            borderColor={currentEditedInstrument ? COLOR_PALETTE[currentEditedInstrument.color] : undefined}
                            containerStyle={{ flexGrow: 1 }}
                        />
                        <button
                            className='theia-button secondary'
                            onClick={addInstrument}
                            title={nls.localizeByDefault('Add')}
                        >
                            <i className='codicon codicon-plus' />
                        </button>
                    </HContainer>
                </VContainer>
                <VContainer grow={1} overflow='auto'>
                    <Instrument
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        instrumentId={currentEditedInstrumentId}
                        setInstrumentId={setCurrentEditedInstrumentId}
                        setInstruments={setInstruments}
                        setWaveformDialogOpen={setWaveformDialogOpen}
                        setModulationDataDialogOpen={setModulationDataDialogOpen}
                        setInstrumentColorDialogOpen={setInstrumentColorDialogOpen}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/sound/test', 'Test')}
                    </label>
                    <HContainer>
                        <AdvancedSelect
                            options={NOTES_LABELS_REVERSED.map(n => ({
                                label: n,
                                value: n,
                            }))}
                            defaultValue={testNote}
                            onChange={options => setTestNote(options[0])}
                            containerStyle={{ flexGrow: 1 }}
                        />
                        <button
                            className={`theia-button ${playingTestNote ? 'primary' : 'secondary'}`}
                            onClick={() => playingTestNote ? playNote('') : playNote(testNote, currentEditedInstrumentId)}
                            disabled={!emulatorInitialized}
                        >
                            <i className={`codicon codicon-debug-${playingTestNote ? 'pause' : 'start'}`} />
                        </button>
                        <button
                            className="theia-button secondary"
                            onClick={() => setForcePlayerRomRebuild(prev => prev + 1)}
                            disabled={!emulatorInitialized || !playingTestNote}
                        >
                            <i className="codicon codicon-debug-restart" />
                        </button>
                    </HContainer>
                </VContainer>
            </VContainer >
        )
        : (
            <EmptyContainer
                title={nls.localize('vuengine/editors/sound/noInstruments', 'There are no instruments')}
                description={nls.localize(
                    'vuengine/editors/sound/clickBelowToAddFirstInstrument',
                    'Click below to add the first instrument',
                )}
                onClick={addInstrument}
            />
        );
}
