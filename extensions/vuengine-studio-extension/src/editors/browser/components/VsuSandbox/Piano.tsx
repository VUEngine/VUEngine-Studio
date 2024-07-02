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
        minWidth: channel === 0 ? 0 : 95,
        opacity: channel === 0 ? 0 : 1,
        overflowY: channel === 0 ? 'hidden' : 'auto',
        transition: 'all 0.2s',
        width: channel === 0 ? 0 : 95,
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
