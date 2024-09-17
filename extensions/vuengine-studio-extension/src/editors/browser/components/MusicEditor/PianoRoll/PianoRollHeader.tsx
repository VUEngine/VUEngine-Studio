import { nls } from '@theia/core';
import React from 'react';
import { SongData } from '../MusicEditorTypes';
import PianoRollHeaderNote from './PianoRollHeaderNote';
import styled from 'styled-components';

const Header = styled.div`
    padding-top: 1px;
`;

interface PianoRollHeaderProps {
    songData: SongData
    currentChannelId: number
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
        playRangeStart, setPlayRangeStart,
        playRangeEnd, setPlayRangeEnd,
        getChannelName,
    } = props;

    const channel = songData.channels[currentChannelId];
    const pattern = channel.patterns[currentPatternId];

    return <Header className="metaLine">
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
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                playRangeStart={playRangeStart}
                setPlayRangeStart={setPlayRangeStart}
                playRangeEnd={playRangeEnd}
                setPlayRangeEnd={setPlayRangeEnd}
            />
        ))
        }
    </Header>;
}
