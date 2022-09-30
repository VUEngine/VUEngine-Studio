import React from 'react';
import { PatternConfig } from '../types';

interface TabInstrumentsProps {
    pattern: PatternConfig | boolean
    currentNote: number
}

export default function TabInstruments(props: TabInstrumentsProps): JSX.Element {
    // const { pattern, currentNote } = props;

    return <>
        <div className='section'>
            Instruments
        </div>
    </>;
}
