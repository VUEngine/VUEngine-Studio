import { Copy, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import AdvancedSelect from '../../Common/Base/AdvancedSelect';
import VContainer from '../../Common/Base/VContainer';
import { nanoid } from '../../Common/Utils';
import { INPUT_BLOCKING_COMMANDS } from '../SoundEditor';
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

interface InstrumentsProps {
    songData: SoundData
    currentInstrument: string
    setCurrentInstrument: (instrument: string) => void
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
        songData,
        currentInstrument, setCurrentInstrument,
        setInstruments,
        setWaveformDialogOpen, setModulationDataDialogOpen,
        playing,
        testing, setTesting, setTestingDuration, setTestingChannel, setTestingNote, setTestingInstrument,
        emulatorInitialized,
    } = props;
    const { disableCommands, enableCommands, services } = useContext(EditorsContext) as EditorsContextType;
    const instrument = songData.instruments[currentInstrument];

    const addInstrument = async () => {
        const type = services.vesProjectService.getProjectDataType('Audio');
        const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
        const newInstrument = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.instruments?.items);
        const newId = nanoid();
        if (newInstrument) {
            setInstruments({
                ...songData.instruments,
                [newId]: {
                    ...newInstrument,
                    name: nls.localizeByDefault('New'),
                },
            });
            setCurrentInstrument(newId);
        }
    };

    const cloneInstrument = async () => {
        const newId = nanoid();
        setInstruments({
            ...songData.instruments,
            [newId]: {
                ...instrument,
                name: `${instrument.name} ${nls.localize('vuengine/general/copy', 'copy')}`,
            },
        });
        setCurrentInstrument(newId);
    };

    const removeCurrentInstrument = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/sound/deleteInstrumentQuestion', 'Delete Instrument?'),
            msg: nls.localize('vuengine/editors/sound/areYouSureYouWantToDelete', 'Are you sure you want to delete {0}?', instrument.name),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedInstruments = { ...songData.instruments };
            delete updatedInstruments[currentInstrument];

            setCurrentInstrument((Object.keys(songData.instruments) ?? [''])[0]);
            // TODO: update references in channels

            setInstruments(updatedInstruments);
        }
    };

    return <VContainer gap={15}>
        <VContainer>
            {nls.localize('vuengine/editors/sound/instruments', 'Instruments')}
            <InputWithAction>
                <AdvancedSelect
                    options={Object.keys(songData.instruments).map((instrumentId, i) => {
                        const instr = songData.instruments[instrumentId];
                        return {
                            value: `${instrumentId}`,
                            label: `${i + 1}: ${instr.name}`,
                        };
                    })}
                    defaultValue={`${currentInstrument}`}
                    onChange={options => setCurrentInstrument(options[0])}
                    commands={INPUT_BLOCKING_COMMANDS}
                />
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localizeByDefault('Remove')}
                    onClick={removeCurrentInstrument}
                    disabled={!instrument}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <Trash size={16} />
                </InputWithActionButton>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/editors/sound/clone', 'Clone')}
                    onClick={cloneInstrument}
                    disabled={!instrument}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <Copy size={16} />
                </InputWithActionButton>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localizeByDefault('Add')}
                    onClick={addInstrument}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                >
                    <i className='codicon codicon-plus' />
                </InputWithActionButton>
            </InputWithAction>
        </VContainer>
        <hr />
        <Instrument
            songData={songData}
            currentInstrument={currentInstrument}
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
    </VContainer>;
}
