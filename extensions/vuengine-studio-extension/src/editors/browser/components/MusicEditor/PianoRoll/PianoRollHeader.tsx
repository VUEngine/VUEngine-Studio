import { nls } from '@theia/core';
import React from 'react';
import { SongData } from '../MusicEditorTypes';
import PianoRollHeaderNote from './PianoRollHeaderNote';

interface PianoRollHeaderProps {
    songData: SongData
    currentChannelId: number
    currentNote: number
    currentPatternId: number
    getChannelName: (channelId: number) => string
    playRangeStart: number
    setPlayRangeStart: (playRangeStart: number) => void
    playRangeEnd: number
    setPlayRangeEnd: (playRangeEnd: number) => void
}

export default function PianoRollHeader(props: PianoRollHeaderProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId,
        currentNote,
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        getChannelName,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    return <div className="metaLine pianoRollHeader">
        <div
            className="metaLineHeader"
            style={{ height: 15 }}
            title={`${nls.localize('vuengine/musicEditor/channel', 'Channel')} / ${nls.localize('vuengine/musicEditor/pattern', 'Pattern')}`}
        >
            {getChannelName(currentChannelId)} / {currentPatternId !== undefined ? currentPatternId + 1 : '-'}
        </div>
        {[...Array(pattern.size)].map((x, index) => (
            <PianoRollHeaderNote
                songData={songData}
                key={index}
                index={index}
                current={index === currentNote}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
            />
        ))
        }
    </div >;
}
