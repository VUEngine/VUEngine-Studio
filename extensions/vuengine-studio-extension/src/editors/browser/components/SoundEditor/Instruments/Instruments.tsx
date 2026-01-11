import { nls } from '@theia/core';
import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import HContainer from '../../Common/Base/HContainer';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import EmptyContainer from '../../Common/EmptyContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { nanoid } from '../../Common/Utils';
import { getInstrumentName } from '../SoundEditor';
import { InstrumentMap, NOTES_LABELS_REVERSED, SoundData, SoundEditorTrackType, TRACK_DEFAULT_INSTRUMENT_ID } from '../SoundEditorTypes';
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

export const StyledInstrumentsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 9px;
    max-width: 240px;
    min-width: 240px;
`;

export const StyledInstrumentsListWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;

    >* {
        padding: 3px;
    }
`;

export const StyledInstrumentsList = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 4px;
    overflow: auto;
`;

export const StyledInstrument = styled.button`
    align-items: center;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    min-height: var(--theia-content-line-height) !important;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.current {
        outline: 1px solid var(--theia-focusBorder);
        outline-offset: 1px;
        z-index: 1;
    }
`;

interface InstrumentsProps {
    soundData: SoundData
    updateSoundData: (soundData: SoundData) => void
    currentTrackId: number
    currentInstrumentId: string
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
        currentTrackId,
        currentInstrumentId,
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
    const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>(currentInstrumentId !== TRACK_DEFAULT_INSTRUMENT_ID
        ? currentInstrumentId
        : soundData.tracks[currentTrackId].instrument
    );

    const addInstrument = async () => {
        const type = services.vesProjectService.getProjectDataType('Sound');
        const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
        // @ts-ignore
        const newInstrument = services.vesProjectService.generateDataFromJsonSchema(schema.properties?.instruments?.additionalProperties);
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

        setInstruments({
            ...soundData.instruments,
            [newId]: {
                ...newInstrument,
                name: `${newNameLabel} ${newNameNumber}`,
            },
        });
        setSelectedInstrumentId(newId);
    };

    useEffect(() => {
        if (playingTestNote) {
            playNote(testNote, selectedInstrumentId);
        }
    }, [selectedInstrumentId]);

    return Object.keys(soundData.instruments).length > 0
        ? (
            <HContainer
                gap={20}
                grow={1}
                overflow='hidden'
            >
                <StyledInstrumentsContainer>
                    <VContainer style={{ padding: 3 }}>
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
                                onClick={() => playingTestNote ? playNote('') : playNote(testNote, selectedInstrumentId)}
                                disabled={!emulatorInitialized}
                            >
                                <i className={`codicon codicon-debug-${playingTestNote ? 'pause' : 'start'}`} />
                            </button>
                            <button
                                className="theia-button secondary"
                                onClick={() => setForcePlayerRomRebuild(prev => prev + 1)}
                                disabled={!emulatorInitialized}
                            >
                                <i className="codicon codicon-debug-restart" />
                            </button>
                        </HContainer>
                    </VContainer>
                    <StyledInstrumentsListWrapper>
                        <label>
                            {nls.localize('vuengine/editors/sound/selectInstrument', 'Select Instrument')}
                        </label>
                        <RadioSelect
                            options={[{
                                label: nls.localize('vuengine/editors/sound/wave', 'Wave'),
                                value: SoundEditorTrackType.WAVE,
                            }, {
                                label: nls.localize('vuengine/editors/sound/waveSm', 'Wave+SM'),
                                value: SoundEditorTrackType.SWEEPMOD,
                            }, {
                                label: nls.localize('vuengine/editors/sound/Noise', 'Noise'),
                                value: SoundEditorTrackType.NOISE,
                            }]}
                            canSelectMany={true}
                            allowBlank={false}
                            defaultValue={typeFilter}
                            onChange={options => setTypeFilter(options.map(o => o.value) as SoundEditorTrackType[])}
                            fitSpace
                        />
                        <StyledInstrumentsList>
                            {Object.keys(soundData.instruments)
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
                                    const instrumentColor = COLOR_PALETTE[instr?.color ?? DEFAULT_COLOR_INDEX];
                                    return <StyledInstrument
                                        key={i}
                                        className={selectedInstrumentId === instrumentId ? 'current' : undefined}
                                        onClick={() => setSelectedInstrumentId(instrumentId)}
                                        style={{
                                            backgroundColor: COLOR_PALETTE[instr.color ?? DEFAULT_COLOR_INDEX],
                                            color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                                        }}
                                    >
                                        {getInstrumentName(soundData, instrumentId)}
                                    </StyledInstrument>;
                                })}
                            <button
                                className='theia-button add-button'
                                onClick={addInstrument}
                                title={nls.localizeByDefault('Add')}
                            >
                                <i className='codicon codicon-plus' />
                            </button>
                        </StyledInstrumentsList>
                    </StyledInstrumentsListWrapper>
                </StyledInstrumentsContainer>
                <VContainer grow={1} style={{ padding: 3 }}>
                    <Instrument
                        soundData={soundData}
                        updateSoundData={updateSoundData}
                        instrumentId={selectedInstrumentId}
                        setInstrumentId={setSelectedInstrumentId}
                        setInstruments={setInstruments}
                        setWaveformDialogOpen={setWaveformDialogOpen}
                        setModulationDataDialogOpen={setModulationDataDialogOpen}
                        setInstrumentColorDialogOpen={setInstrumentColorDialogOpen}
                    />
                </VContainer>
            </HContainer>
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
