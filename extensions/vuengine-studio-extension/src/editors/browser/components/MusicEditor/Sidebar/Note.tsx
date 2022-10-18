import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../../../../core/browser/components/HContainer';
import VContainer from '../../../../../core/browser/components/VContainer';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorContext, MusicEditorContextType, Notes, VOLUME_STEPS } from '../MusicEditorTypes';

export default function Note(): JSX.Element {
    const { state, songData, setNote, setVolumeL, setVolumeR } = useContext(MusicEditorContext) as MusicEditorContextType;

    const pattern = songData.channels[state.currentChannel].patterns[state.currentPattern];

    if (state.currentNote === -1) {
        return <VContainer gap={10}>
            {nls.localize(
                'vuengine/musicEditor/selectANote',
                'Select a note to edit its properties'
            )}
        </VContainer>;
    }

    const note = pattern.notes[state.currentNote];
    let volumeL = 100;
    let volumeR = 100;
    pattern.volumeL
        .filter((n, i) => i < state.currentNote)
        .forEach((n, i) => {
            if (n !== undefined) {
                volumeL = n;
            }
        });
    pattern.volumeR
        .filter((n, i) => i < state.currentNote)
        .forEach((n, i) => {
            if (n !== undefined) {
                volumeR = n;
            }
        });
    volumeL = pattern.volumeL[state.currentNote] ?? volumeL;
    volumeR = pattern.volumeR[state.currentNote] ?? volumeR;

    return <VContainer gap={10}>
        <VContainer>
            Note
            <select
                className='theia-select'
                onChange={e => setNote(state.currentNote, parseInt(e.target.value))}
                value={note ?? -1}
            >
                <option value={undefined}>none</option>
                {Notes.map((n, i) =>
                    i <= LOWEST_NOTE &&
                    i >= HIGHEST_NOTE && (
                        <option key={`note-select-${i}`} value={i}>{n}</option>
                    ))}
            </select>
            {/* <SelectComponent
                options={[{
                    value: '-1',
                    label: 'none'
                }].concat(Notes
                    .filter((n, i) => (i <= LOWEST_NOTE && i >= HIGHEST_NOTE))
                    .map((n, i) => ({
                        value: (i + HIGHEST_NOTE).toString(),
                        label: n.toString()
                    })))}
                defaultValue={note?.toString() ?? '-1'}
                onChange={option => setNote(state.currentNote, parseInt(option.value!))}
            /> */}
        </VContainer>

        <VContainer>
            <label>Volume</label>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    L
                </div>
                <input
                    type='range'
                    value={volumeL}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setVolumeL(state.currentNote, parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {volumeL}
                </div>

            </HContainer>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    R
                </div>
                <input
                    type='range'
                    value={volumeR}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setVolumeR(state.currentNote, parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
                    {volumeR}
                </div>
            </HContainer>
        </VContainer>

        <VContainer>
            <label>Effects</label>
            <i>Not yet implemented</i>
        </VContainer>
    </VContainer>;
}
