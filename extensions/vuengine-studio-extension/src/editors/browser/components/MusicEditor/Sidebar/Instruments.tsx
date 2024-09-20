import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/VContainer';
import WaveForm from '../../WaveFormEditor/WaveForm';
import { INPUT_BLOCKING_COMMANDS } from '../MusicEditor';
import { InstrumentConfig, SongData } from '../MusicEditorTypes';

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
    width: 32px;
`;

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
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

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
                    onClick={removeCurrentInstrument}
                    title={nls.localize('vuengine/musicEditor/deleteInstrument', 'Delete Instrument')}
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
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/name', 'Name')}
            </label>
            <input
                className='theia-input'
                value={instrument.name}
                onChange={e => setName(e.target.value)}
                onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
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
