import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/VContainer';
import { InstrumentConfig, SongData } from '../MusicEditorTypes';
import Instrument from './Instrument';

export const InputWithAction = styled.div`
    display: flex;
    gap: 5px;

    :first-child {
        flex-grow: 1;
    }
`;

export const InputWithActionButton = styled.button`
    margin: 0;
    min-width: 32px;
    padding: 0;
    width: 32px;
`;

interface InstrumentsProps {
    songData: SongData
    currentInstrument: number
    setCurrentInstrument: (instrument: number) => void
    setInstruments: (instruments: InstrumentConfig[]) => void
    setSidebarTab: Dispatch<SetStateAction<number>>
    setModulationDataDialogOpen: Dispatch<SetStateAction<number>>
}

export default function Instruments(props: InstrumentsProps): React.JSX.Element {
    const {
        songData,
        currentInstrument, setCurrentInstrument,
        setInstruments,
        setSidebarTab,
        setModulationDataDialogOpen,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const instrument = songData.instruments[currentInstrument];

    const addInstrument = async () => {
        const type = services.vesProjectService.getProjectDataType('Audio');
        const schema = await window.electronVesCore.dereferenceJsonSchema(type!.schema);
        const newInstrument = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.instruments?.items);
        if (newInstrument) {
            setInstruments([
                ...songData.instruments,
                {
                    ...newInstrument,
                    name: nls.localizeByDefault('New'),
                },
            ]);
            setCurrentInstrument(songData.instruments.length);
        }
    };

    const removeCurrentInstrument = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/musicEditor/deleteInstrumentQuestion', 'Delete Instrument?'),
            msg: nls.localize('vuengine/musicEditor/areYouSureYouWantToDelete', 'Are you sure you want to delete {0}?', instrument.name),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedInstruments = [...songData.instruments];
            updatedInstruments.splice(currentInstrument, 1);

            setCurrentInstrument(currentInstrument > 0 ? currentInstrument - 1 : 0);
            // TODO: update references in channels

            setInstruments(updatedInstruments);
        }
    };

    return <VContainer gap={15}>
        <VContainer>
            {nls.localize('vuengine/musicEditor/instruments', 'Instruments')}
            <InputWithAction>
                <select
                    className='theia-select'
                    value={currentInstrument}
                    onChange={e => setCurrentInstrument(parseInt(e.target.value))}
                >
                    {songData.instruments.map((n, i) =>
                        <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                    )}
                </select>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/musicEditor/deleteInstrument', 'Delete Instrument')}
                    onClick={removeCurrentInstrument}
                    disabled={songData.instruments.length <= 1}
                >
                    <i className='fa fa-minus' />
                </InputWithActionButton>
                <InputWithActionButton
                    className='theia-button secondary'
                    title={nls.localize('vuengine/musicEditor/addInstrument', 'Add Instrument')}
                    onClick={addInstrument}
                >
                    <i className='codicon codicon-plus' />
                </InputWithActionButton>
            </InputWithAction>
        </VContainer>
        <Instrument
            songData={songData}
            currentInstrument={currentInstrument}
            setInstruments={setInstruments}
            setSidebarTab={setSidebarTab}
            setModulationDataDialogOpen={setModulationDataDialogOpen}
        />
    </VContainer>;
}
