import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';
import NotePropertiesNote from './NotePropertiesNote';

interface NotePropertiesProps {
    bar: number
    pattern: PatternConfig
    currentNote: number
    stateApi: MusicEditorStateApi
}

export default function NoteProperties(props: NotePropertiesProps): JSX.Element {
    const { bar, pattern, currentNote, stateApi } = props;

    const classNames = ['noteProperties'];

    let volumeL = 100;
    let volumeR = 100;

    return <div className={classNames.join(' ')}>
        <div className='notePropertiesHeader'>
            <div>Effects</div>
            <div>Volume</div>
        </div>
        {[...Array(pattern.size)].map((x, index) => {
            volumeL = pattern.volumeL[index] ?? volumeL;
            volumeR = pattern.volumeR[index] ?? volumeR;
            return (
                <NotePropertiesNote
                    key={`pianoroll-note-properties-volume-note-${index}`}
                    pattern={pattern}
                    index={index}
                    current={index === currentNote}
                    bar={bar}
                    effects={[]}
                    volumeL={volumeL}
                    volumeR={volumeR}
                    stateApi={stateApi}
                />
            );
        })}
    </div>;
}