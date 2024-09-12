import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import VContainer from '../../Common/VContainer';
import WaveForm from '../../WaveFormEditor/WaveForm';
import { InstrumentConfig, SongData } from '../MusicEditorTypes';

interface InstrumentsProps {
    songData: SongData
    currentInstrument: number
    setCurrentInstrument: (instrument: number) => void
    setInstruments: (instruments: InstrumentConfig[]) => void
}

export default function Instruments(props: InstrumentsProps): React.JSX.Element {
    const {
        songData,
        currentInstrument,
        setCurrentInstrument,
        setInstruments,
    } = props;

    const instrument = songData.instruments[currentInstrument];

    const setName = (name: string) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            name,
        };

        setInstruments(updatedInstruments);
    };

    const setWaveform = (waveform: number[]) => {
        const updatedInstruments = [...songData.instruments];
        updatedInstruments[currentInstrument] = {
            ...updatedInstruments[currentInstrument],
            waveform,
        };

        setInstruments(updatedInstruments);
    };

    const addInstrument = () => {
        setCurrentInstrument(songData.instruments.length);
        setInstruments([
            ...songData.instruments,
            {
                name: nls.localize('vuengine/musicEditor/new', 'New'),
                waveform: [...Array(32)].map(x => 1),
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
            updatedInstruments.splice(currentInstrument, 1);

            setCurrentInstrument(currentInstrument > 0 ? currentInstrument - 1 : 0);
            // TODO: update references in channels

            setInstruments(updatedInstruments);
        }
    };

    return <VContainer gap={10}>
        <VContainer>
            {nls.localize('vuengine/musicEditor/instrument', 'Instrument')}
            <div className='inputWithAction'>
                <select
                    className='theia-select'
                    onChange={e => setCurrentInstrument(parseInt(e.target.value))}
                    value={currentInstrument}
                >
                    {songData.instruments.map((n, i) =>
                        <option key={`instrument-select-${i}`} value={i}>{n.name}</option>
                    )}
                </select>
                <button
                    className='theia-button secondary'
                    onClick={removeCurrentInstrument}
                    title={nls.localize('vuengine/musicEditor/deleteInstrument', 'Delete Instrument')}
                    disabled={songData.instruments.length <= 1}
                >
                    <i className='fa fa-minus' />
                </button>
                <button
                    className='theia-button secondary'
                    title={nls.localize('vuengine/musicEditor/addInstrument', 'Add Instrument')}
                    onClick={addInstrument}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </div>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/name', 'Name')}
            </label>
            <input
                className='theia-input'
                value={instrument.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/waveform', 'Waveform')}
            </label>
            <WaveForm
                value={instrument.waveform}
                setValue={setWaveform}
            />
        </VContainer>
    </VContainer>;
}
