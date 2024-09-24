import { nls } from '@theia/core';
import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, SongData } from '../MusicEditorTypes';
import NotePropertiesNote from './NotePropertiesNote';
import { MetaLine, MetaLineHeader, MetaLineHeaderLine } from './StyledComponents';

interface NotePropertiesProps {
    songData: SongData
    setCurrentNote: (currentNote: number) => void
    currentChannelId: number
    currentPatternId: number
    setNote: (index: number, note: number | undefined) => void
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        songData,
        setCurrentNote,
        currentChannelId,
        currentPatternId,
        setNote,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;

    let volumeL = 100;
    let volumeR = 100;

    return <MetaLine style={{ bottom: 0 }}>
        <MetaLineHeader>
            <MetaLineHeaderLine>
                {nls.localize('vuengine/musicEditor/effects', 'Effects')}
            </MetaLineHeaderLine>
            <MetaLineHeaderLine>
                {nls.localize('vuengine/musicEditor/volume', 'Volume')}
            </MetaLineHeaderLine>
        </MetaLineHeader>
        {[...Array(patternSize)].map((x, index) => {
            volumeL = pattern.volumeL[index] ?? volumeL;
            volumeR = pattern.volumeR[index] ?? volumeR;
            return (
                <NotePropertiesNote
                    key={`pianoroll-note-properties-volume-note-${index}`}
                    index={index}
                    effects={[]}
                    noteResolution={songData.noteResolution}
                    volumeL={volumeL}
                    volumeR={volumeR}
                    setCurrentNote={setCurrentNote}
                    setNote={setNote}
                />
            );
        })}
    </MetaLine>;
}
