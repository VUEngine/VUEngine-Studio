import React, { useContext } from 'react';
import { MusicEditorContext, MusicEditorContextType } from '../MusicEditorTypes';
import NotePropertiesNote from './NotePropertiesNote';

export default function NoteProperties(): JSX.Element {
    const { state, songData } = useContext(MusicEditorContext) as MusicEditorContextType;

    const channel = songData.channels[state.currentChannel];
    const pattern = channel.patterns[state.currentPattern];

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
                    index={index}
                    current={index === state.currentNote}
                    effects={[]}
                    volumeL={volumeL}
                    volumeR={volumeR}
                />
            );
        })}
    </div>;
}
