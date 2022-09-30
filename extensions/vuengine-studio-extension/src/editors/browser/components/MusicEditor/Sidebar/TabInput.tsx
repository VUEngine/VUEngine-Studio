import React from 'react';
import { PatternConfig } from '../MusicEditorTypes';

interface TabInputProps {
    pattern: PatternConfig | boolean
    currentNote: number
}

export default function TabInput(props: TabInputProps): JSX.Element {
    // const { pattern, currentNote } = props;

    return <>
        <div className='section'>
            Input Devices
        </div>
    </>;
}
