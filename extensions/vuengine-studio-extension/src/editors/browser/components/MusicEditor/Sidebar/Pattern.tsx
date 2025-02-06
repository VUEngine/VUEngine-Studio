import { nls } from '@theia/core';
import React from 'react';
import { PatternConfig, SongData } from '../MusicEditorTypes';
import CurrentPattern from './CurrentPattern';

interface PatternProps {
    songData: SongData
    currentChannelId: number
    currentPatternId: number
    setCurrentPatternId: (channelId: number, patternId: number) => void
    setPattern: (channelId: number, patternId: number, pattern: Partial<PatternConfig>) => void
}

export default function Pattern(props: PatternProps): React.JSX.Element {
    const {
        songData,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        setPattern,
    } = props;

    return <>
        {currentPatternId > -1
            ? <CurrentPattern
                songData={songData}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                setCurrentPatternId={setCurrentPatternId}
                setPattern={setPattern}
            />
            : <div className="lightLabel">
                {nls.localize('vuengine/editors/music/selectPatternToEditProperties', 'Select a pattern to edit its properties')}
            </div>
        }
    </>;
}
