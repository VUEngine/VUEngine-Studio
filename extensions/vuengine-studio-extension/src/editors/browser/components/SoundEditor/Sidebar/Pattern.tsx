import { nls } from '@theia/core';
import React from 'react';
import { PatternConfig, SoundData } from '../SoundEditorTypes';
import CurrentPattern from './CurrentPattern';

interface PatternProps {
    soundData: SoundData
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    setPattern: (channelId: number, patternId: string, pattern: Partial<PatternConfig>) => void
}

export default function Pattern(props: PatternProps): React.JSX.Element {
    const {
        soundData,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        setPattern,
    } = props;

    return <>
        {currentPatternId !== ''
            ? <CurrentPattern
                soundData={soundData}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                setCurrentPatternId={setCurrentPatternId}
                setPattern={setPattern}
            />
            : <div className="lightLabel">
                {nls.localize('vuengine/editors/sound/selectPatternToEditProperties', 'Select a pattern to edit its properties')}
            </div>
        }
    </>;
}
