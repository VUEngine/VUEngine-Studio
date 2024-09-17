import React from 'react';
import { HIGHEST_NOTE, LOWEST_NOTE, NOTES } from '../MusicEditor/MusicEditorTypes';
import PianoKeys from './PianoKeys';

interface PianoProps {
    channel: number
    setFrequency: (channel: number, frequency: number) => void
}

export default function Piano(props: PianoProps): React.JSX.Element {
    const { channel, setFrequency } = props;

    return <div className="pianoRollEditor" style={{
        minWidth: 85,
        opacity: channel === 0 ? .3 : 1,
        overflowY: 'auto',
        transition: 'opacity .2s',
        width: 85,
    }}>
        {Object.keys(NOTES).map((note, index) =>
            index <= LOWEST_NOTE &&
            index >= HIGHEST_NOTE && <PianoKeys
                key={`pianoroll-row-${index}`}
                note={note}
                noteId={index}
                channel={channel}
                setFrequency={setFrequency}
            />)}
    </div>;
}
