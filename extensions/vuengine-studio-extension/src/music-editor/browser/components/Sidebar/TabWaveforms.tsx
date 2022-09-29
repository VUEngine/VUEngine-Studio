import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../types';

interface TabWaveformsProps {
    pattern: PatternConfig | boolean
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function TabWaveforms(props: TabWaveformsProps): JSX.Element {
    // const { pattern, currentNote, stateApi } = props;

    return <>
        <div className='section'>
            Waveforms
        </div>
    </>;
}
