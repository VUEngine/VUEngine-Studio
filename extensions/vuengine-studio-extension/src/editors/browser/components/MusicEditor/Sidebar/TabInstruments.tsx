import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import VContainer from '../../../../../core/browser/components/VContainer';
import { InstrumentConfig } from '../MusicEditorTypes';

interface TabInstrumentsProps {
    instruments: InstrumentConfig[]
    setInstruments: (instruments: InstrumentConfig[]) => void
    currentInstrument: number
    setCurrentInstrument: (instrument: number) => void
}

export default function TabInstruments(props: TabInstrumentsProps): JSX.Element {
    const { instruments, setInstruments, currentInstrument, setCurrentInstrument } = props;

    const instrument = instruments[currentInstrument];

    const setName = (name: string) => {
        const updatedInstruments = [...instruments];
        updatedInstruments[currentInstrument].name = name;

        setInstruments(updatedInstruments);
    };

    const addInstrument = () => {
        setCurrentInstrument(instruments.length);
        setInstruments([
            ...instruments,
            {
                name: 'New'
            }
        ]);
    };

    const removeCurrentInstrument = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/musicEditor/deleteInstrumentQuestion', 'Delete Instrument?'),
            msg: nls.localize('vuengine/musicEditor/areYouSureYouWantToDelete', 'Are you sure you want to delete {0}?', instrument.name),
        });
        const remove = await dialog.open();
        if (remove) {
            const updatedInstruments = [...instruments];
            updatedInstruments.splice(currentInstrument, 1);

            setCurrentInstrument(currentInstrument > 0 ? currentInstrument - 1 : 0);
            // TODO: update references in channels

            setInstruments(updatedInstruments);
        }
    };

    return <>
        <div className='section'>
            <VContainer>
                Instruments
                <div className='inputWithAction'>
                    <select
                        className='theia-select'
                        onChange={e => setCurrentInstrument(parseInt(e.target.value))}
                        value={currentInstrument}
                    >
                        {instruments.map((n, i) =>
                            <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                        )}
                    </select>
                    <button
                        className='theia-button secondary'
                        onClick={removeCurrentInstrument}
                        disabled={instruments.length <= 1}
                    >
                        <i className='fa fa-minus' />
                    </button>
                    <button
                        className='theia-button secondary'
                        onClick={addInstrument}
                    >
                        <i className='fa fa-plus' />
                    </button>
                </div>
            </VContainer>
        </div>
        <div className='section'>
            <VContainer>
                <label>Name</label>
                <input
                    className='theia-input'
                    value={instrument.name}
                    onChange={e => setName(e.target.value)}
                />
            </VContainer>
        </div>
    </>;
}
