import React from 'react';
import { PatternConfig } from '../MusicEditorTypes';

interface TabWaveformsProps {
    pattern: PatternConfig | boolean
    currentNote: number
}

export default function TabWaveforms(props: TabWaveformsProps): JSX.Element {
    // const { pattern, currentNote } = props;

    return <>
        <div className='section'>
            Waveforms
        </div>
    </>;
}
