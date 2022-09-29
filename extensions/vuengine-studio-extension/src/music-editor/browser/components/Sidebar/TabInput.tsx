import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../types';

interface TabInputProps {
    pattern: PatternConfig | boolean
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function TabInput(props: TabInputProps): JSX.Element {
    // const { pattern, currentNote, stateApi } = props;

    return <>
        <div className='section'>
            Input Devices
        </div>
    </>;
}
