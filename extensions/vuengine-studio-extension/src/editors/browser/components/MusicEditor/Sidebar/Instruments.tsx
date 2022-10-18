import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import VContainer from '../../../../../core/browser/components/VContainer';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';

export default function Instruments(): JSX.Element {
    const { state, songData, setInstruments, setCurrentInstrument } = useContext(MusicEditorContext) as MusicEditorContextType;

    const instrument = songData.instruments[state.currentInstrument];

    const setName = (name: string) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[state.currentInstrument].name = name;

        setInstruments(updatedInstruments);
    };

    const addInstrument = () => {
        setCurrentInstrument(songData.instruments.length);
        setInstruments([
            ...songData.instruments,
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
            const updatedInstruments = [...songData.instruments];
            updatedInstruments.splice(state.currentInstrument, 1);

            setCurrentInstrument(state.currentInstrument > 0 ? state.currentInstrument - 1 : 0);
            // TODO: update references in channels

            setInstruments(updatedInstruments);
        }
    };

    return <VContainer gap={10}>
        <VContainer>
            Instruments
            <div className='inputWithAction'>
                <select
                    className='theia-select'
                    onChange={e => setCurrentInstrument(parseInt(e.target.value))}
                    value={state.currentInstrument}
                >
                    {songData.instruments.map((n, i) =>
                        <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                    )}
                </select>
                <button
                    className='theia-button secondary'
                    onClick={removeCurrentInstrument}
                    disabled={songData.instruments.length <= 1}
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
        <VContainer>
            <label>Name</label>
            <input
                className='theia-input'
                value={instrument.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
    </VContainer>;
}
