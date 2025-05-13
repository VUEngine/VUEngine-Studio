import { nls } from '@theia/core';
import chroma from 'chroma-js';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';
import { nanoid } from '../../Common/Utils';
import { InstrumentMap, SoundData } from '../SoundEditorTypes';
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
    gap: 4px;
    overflow: auto;
    padding: 3px;
    width: 200px;
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
        outline: 3px solid var(--theia-focusBorder);
        outline-offset: 1px;
        z-index: 1;
    }
`;

interface InstrumentsProps {
    soundData: SoundData
    currentInstrument: string
    setCurrentInstrument: Dispatch<SetStateAction<string>>
    setInstruments: (instruments: InstrumentMap) => void
    setWaveformDialogOpen: Dispatch<SetStateAction<string>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<string>>
    playing: boolean
    testing: boolean
    setTesting: (testing: boolean) => void
    setTestingDuration: (note: number) => void
    setTestingNote: (note: number) => void
    setTestingInstrument: (note: string) => void
    setTestingChannel: (channel: number) => void
    emulatorInitialized: boolean
}

export default function Instruments(props: InstrumentsProps): React.JSX.Element {
    const {
        soundData,
        currentInstrument, setCurrentInstrument,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen,
        playing,
        testing, setTesting, setTestingDuration, setTestingChannel, setTestingNote, setTestingInstrument,
        emulatorInitialized,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const addInstrument = async () => {
        const type = services.vesProjectService.getProjectDataType('Sound');
        const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
        // @ts-ignore
        const newInstrument = services.vesProjectService.generateDataFromJsonSchema(schema.properties?.instruments?.additionalProperties);
        if (!newInstrument) {
            return;
        }

        const newId = nanoid();
        setInstruments({
            ...soundData.instruments,
            [newId]: {
                ...newInstrument,
                name: nls.localizeByDefault('New'),
            },
        });
        setCurrentInstrument(newId);
    };

    return <HContainer
        gap={20}
        grow={1}
        overflow='hidden'
        style={{ padding: '0 var(--padding) var(--padding) calc(var(--padding) - 3px)' }}
    >
        <StyledInstrumentsContainer>
            {Object.keys(soundData.instruments)
                .sort((a, b) => soundData.instruments[a].name.localeCompare(soundData.instruments[b].name))
                .map((instrumentId, i) => {
                    const instr = soundData.instruments[instrumentId];
                    const instrumentColor = COLOR_PALETTE[instr?.color ?? DEFAULT_COLOR_INDEX];
                    const name = instr.name.length ? instr.name : (i + 1).toString();
                    return <StyledInstrument
                        className={currentInstrument === instrumentId ? 'current' : undefined}
                        onClick={() => setCurrentInstrument(instrumentId)}
                        style={{
                            backgroundColor: COLOR_PALETTE[instr.color ?? DEFAULT_COLOR_INDEX],
                            color: chroma.contrast(instrumentColor, 'white') > 2 ? 'white' : 'black',
                        }}
                    >
                        {name}
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
                currentInstrument={currentInstrument}
                setCurrentInstrument={setCurrentInstrument}
                setInstruments={setInstruments}
                setWaveformDialogOpen={setWaveformDialogOpen}
                setModulationDataDialogOpen={setModulationDataDialogOpen}
                playing={playing}
                testing={testing}
                setTesting={setTesting}
                setTestingDuration={setTestingDuration}
                setTestingNote={setTestingNote}
                setTestingInstrument={setTestingInstrument}
                setTestingChannel={setTestingChannel}
                emulatorInitialized={emulatorInitialized}
            />
        </VContainer>
    </HContainer>;
}
