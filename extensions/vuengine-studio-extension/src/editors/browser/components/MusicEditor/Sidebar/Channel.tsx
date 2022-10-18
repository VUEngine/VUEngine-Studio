import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';
import CurrentChannel from './CurrentChannel';
import CurrentPattern from './CurrentPattern';

export default function Channel(): JSX.Element {
    const { state } = useContext(MusicEditorContext) as MusicEditorContextType;

    return <>
        {state.currentChannel > -1
            ? <CurrentChannel />
            : <div>
                Select a channel to edit its properties
            </div>}

        {state.currentPattern > -1 && <>
            <div className="divider"></div>
            <CurrentPattern />
        </>}
    </>;
}
