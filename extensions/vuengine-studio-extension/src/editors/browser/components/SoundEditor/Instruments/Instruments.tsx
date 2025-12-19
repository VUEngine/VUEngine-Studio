import { nls } from '@theia/core';
import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, useContext, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { nanoid } from '../../Common/Utils';
import { InstrumentMap, SoundData, TRACK_DEFAULT_INSTRUMENT_ID } from '../SoundEditorTypes';
import Instrument from './Instrument';
import { getInstrumentName } from '../SoundEditor';

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
    gap: 4px;
    max-width: 240px;
    min-width: 240px;
    overflow: auto;
    padding: 3px;
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
    playing: boolean
    testing: boolean
    setTesting: (testing: boolean) => void
    setTestingDuration: (note: number) => void
    setTestingNote: (note: number) => void
    setTestingInstrument: (note: string) => void
    setTestingTrack: (track: number) => void
    emulatorInitialized: boolean
}

export default function Instruments(props: InstrumentsProps): React.JSX.Element {
    const {
        soundData, updateSoundData,
        currentTrackId,
        currentInstrumentId,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen, setInstrumentColorDialogOpen,
        playing,
        testing, setTesting, setTestingDuration, setTestingTrack, setTestingNote, setTestingInstrument,
        emulatorInitialized,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
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

    return <HContainer
        gap={20}
        grow={1}
        overflow='hidden'
        style={{ padding: '0 var(--padding) var(--padding) calc(var(--padding) - 3px)' }}
    >
        <StyledInstrumentsContainer>
            {Object.keys(soundData.instruments)
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
        </StyledInstrumentsContainer>
        <VContainer grow={1}>
            <Instrument
                soundData={soundData}
                updateSoundData={updateSoundData}
                instrumentId={selectedInstrumentId}
                setInstrumentId={setSelectedInstrumentId}
                setInstruments={setInstruments}
                setWaveformDialogOpen={setWaveformDialogOpen}
                setModulationDataDialogOpen={setModulationDataDialogOpen}
                setInstrumentColorDialogOpen={setInstrumentColorDialogOpen}
                playing={playing}
                testing={testing}
                setTesting={setTesting}
                setTestingDuration={setTestingDuration}
                setTestingNote={setTestingNote}
                setTestingInstrument={setTestingInstrument}
                setTestingTrack={setTestingTrack}
                emulatorInitialized={emulatorInitialized}
            />
        </VContainer>
    </HContainer>;
}
