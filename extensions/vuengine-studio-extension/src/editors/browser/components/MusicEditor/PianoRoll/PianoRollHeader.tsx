import { nls } from '@theia/core';
import React from 'react';
import { BAR_PATTERN_LENGTH_MULT_MAP, SongData } from '../MusicEditorTypes';
import PianoRollHeaderNote from './PianoRollHeaderNote';
import { MetaLine, MetaLineHeader, MetaLineHeaderLine } from './StyledComponents';

interface PianoRollHeaderProps {
    songData: SongData
    currentChannelId: number
    currentPatternId: number
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
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];
    const patternSize = BAR_PATTERN_LENGTH_MULT_MAP[pattern.bar] * songData.noteResolution;

    return <MetaLine style={{ top: 0 }}>
        <MetaLineHeader
            style={{ height: 15 }}
            title={`${nls.localize('vuengine/musicEditor/channel', 'Channel')} / ${nls.localize('vuengine/musicEditor/pattern', 'Pattern')}`}
        >
            <MetaLineHeaderLine>
            </MetaLineHeaderLine>
        </MetaLineHeader>
        {[...Array(patternSize)].map((x, index) => (
            <PianoRollHeaderNote
                songData={songData}
                key={index}
                index={index}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
            />
        ))
        }
    </MetaLine>;
}
