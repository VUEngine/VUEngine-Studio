import { nls } from '@theia/core';
import React from 'react';
import { SongData } from '../MusicEditorTypes';
import NotePropertiesNote from './NotePropertiesNote';

interface NotePropertiesProps {
    songData: SongData
    currentNote: number
    setCurrentNote: (currentNote: number) => void
    currentChannelId: number
    currentPatternId: number
    setNote: (index: number, note: number | undefined) => void
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        songData,
        currentNote, setCurrentNote,
        currentChannelId,
        currentPatternId,
        setNote,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    let volumeL = 100;
    let volumeR = 100;

    return <div className="metaLine" style={{ marginTop: 3 }}>
        <div className="metaLineHeader">
            <div>
                {nls.localize('vuengine/musicEditor/effects', 'Effects')}
            </div>
            <div>
                {nls.localize('vuengine/musicEditor/volume', 'Volume')}
            </div>
        </div>
        {[...Array(pattern.size)].map((x, index) => {
            volumeL = pattern.volumeL[index] ?? volumeL;
            volumeR = pattern.volumeR[index] ?? volumeR;
            return (
                <NotePropertiesNote
                    key={`pianoroll-note-properties-volume-note-${index}`}
                    index={index}
                    current={index === currentNote}
                    effects={[]}
                    volumeL={volumeL}
                    volumeR={volumeR}
                    songData={songData}
                    setCurrentNote={setCurrentNote}
                    setNote={setNote}
                />
            );
        })}
    </div>;
}
