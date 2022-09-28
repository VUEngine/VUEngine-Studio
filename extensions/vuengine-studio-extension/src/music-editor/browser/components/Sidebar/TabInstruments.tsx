import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';

interface TabInstrumentsProps {
    pattern: PatternConfig | boolean
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function TabInstruments(props: TabInstrumentsProps): JSX.Element {
    // const { pattern, currentNote, stateApi } = props;

    return <>
        <div className='section'>
            Instruments
        </div>
    </>;
}
