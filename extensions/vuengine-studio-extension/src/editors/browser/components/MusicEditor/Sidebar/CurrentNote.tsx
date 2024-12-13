import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { NOTES, PatternConfig, SongData, VOLUME_STEPS } from '../MusicEditorTypes';

interface CurrentNoteProps {
    songData: SongData
    currentChannelId: number
    currentPatternId: number
    currentNote: number
    setCurrentPatternId: (channelId: number, patternId: number) => void
    setPattern: (channelId: number, patternId: number, pattern: Partial<PatternConfig>) => void
    setNote: (index: number, note: number | undefined) => void
}

export default function CurrentNote(props: CurrentNoteProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        currentNote,
        setNote,
        setPattern,
    } = props;

    const pattern = songData.channels[currentChannelId].patterns[currentPatternId];

    const setVolumeL = (index: number, volume: number | undefined): void => {
        const updatedVolume = [...songData.channels[currentChannelId].patterns[currentPatternId].volumeL];
        updatedVolume[index] = volume;
        setPattern(currentChannelId, currentPatternId, {
            volumeL: updatedVolume
        });
    };

    const setVolumeR = (index: number, volume: number | undefined): void => {
        const updatedVolume = [...songData.channels[currentChannelId].patterns[currentPatternId].volumeR];
        updatedVolume[index] = volume;
        setPattern(currentChannelId, currentPatternId, {
            volumeR: updatedVolume
        });
    };

    if (currentNote === -1) {
        return <VContainer gap={15} className="lightLabel">
            {nls.localize('vuengine/musicEditor/selectNoteToEditProperties', 'Select a note to edit its properties')}
        </VContainer>;
    }

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

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/currentNote', 'Current Note')}
            </label>
            <select
                className='theia-select'
                onChange={e => setNote(currentNote, parseInt(e.target.value))}
                value={note ?? -1}
            >
                <option value={undefined}>none</option>
                {Object.keys(NOTES).map((n, i) =>
                    <option key={`note-select-${i}`} value={i}>{n}</option>
                )}
            </select>
            {/* <SelectComponent
                options={[{
                    value: '-1',
                    label: 'none'
                }].concat(Notes
                    .map((n, i) => ({
                        value: i.toString(),
                        label: n.toString()
                    })))}
                defaultValue={note?.toString() ?? '-1'}
                onChange={option => setNote(currentNote, parseInt(option.value!))}
            /> */}
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/volume', 'Volume')}
            </label>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    {nls.localize('vuengine/musicEditor/leftShort', 'L')}
                </div>
                <input
                    type='range'
                    value={volumeL}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setVolumeL(currentNote, parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {volumeL}
                </div>
            </HContainer>
            <HContainer>
                <div style={{ minWidth: 10, width: 10 }}>
                    {nls.localize('vuengine/musicEditor/rightShort', 'R')}
                </div>
                <input
                    type='range'
                    value={volumeR}
                    max={100}
                    min={0}
                    step={100 / VOLUME_STEPS}
                    onChange={e => setVolumeR(currentNote, parseInt(e.target.value))}
                />
                <div style={{ minWidth: 24, overflow: 'hidden', textAlign: 'right', width: 24 }}>
                    {volumeR}
                </div>
            </HContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/musicEditor/effects', 'Effects')}
            </label>
            <i>Not yet implemented</i>
        </VContainer>
    </VContainer>;
}
