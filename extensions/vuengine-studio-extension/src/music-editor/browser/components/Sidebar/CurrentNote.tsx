import React from 'react';
import HContainer from '../../../../core/browser/components/HContainer';
import VContainer from '../../../../core/browser/components/VContainer';
import { HIGHEST_NOTE, LOWEST_NOTE, MusicEditorStateApi, Notes, PatternConfig, VOLUME_STEPS } from '../../ves-music-editor-types';

interface CurrentNoteProps {
    pattern: PatternConfig
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function CurrentNote(props: CurrentNoteProps): JSX.Element {
    const { currentNote, pattern, stateApi } = props;

    const note = pattern.notes[currentNote];
    let volumeL = 100;
    let volumeR = 100;
    pattern.volumeL
        .filter((n, i) => i < currentNote)
        .forEach((n, i) => {
            if (n !== undefined) {
                volumeL = n;
            }
        });
    pattern.volumeR
        .filter((n, i) => i < currentNote)
        .forEach((n, i) => {
            if (n !== undefined) {
                volumeR = n;
            }
        });
    volumeL = pattern.volumeL[currentNote] ?? volumeL;
    volumeR = pattern.volumeR[currentNote] ?? volumeR;

    return <div className='section currentNote'>
        <VContainer>
            Note
            <select
                className='theia-select'
                style={{ flexGrow: 1 }}
                onChange={e => stateApi.setNote(currentNote, parseInt(e.target.value))}
                value={note ?? -1}
            >
                <option value={undefined}>none</option>
                {Notes.map((n, i) =>
                    i <= LOWEST_NOTE &&
                    i >= HIGHEST_NOTE && (
                        <option key={`note-select-${i}`} value={i}>{n}</option>
                    ))}
            </select>
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
                    onChange={e => stateApi.setVolumeL(currentNote, parseInt(e.target.value))}
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
                    onChange={e => stateApi.setVolumeR(currentNote, parseInt(e.target.value))}
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
    </div>;
}
