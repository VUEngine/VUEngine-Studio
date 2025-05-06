import React from 'react';
import { SoundEvent } from '../SoundEditorTypes';
import { MetaLineTick, MetaLineTickEffects } from './StyledComponents';
import { AVAILABLE_EVENTS } from '../Sidebar/AvailableEvents';

interface NotePropertiesNoteProps {
    index: number
    current: boolean
    effects: SoundEvent[]
    setCurrentTick: (currentTick: number) => void
    setNote: (step: number, note?: number, duration?: number) => void
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): React.JSX.Element {
    const { index, current, effects, setCurrentTick, setNote: removeNote } = props;

    return <MetaLineTick
        className={current ? 'current' : undefined}
        onClick={() => setCurrentTick(index)}
        onContextMenu={() => removeNote(index)}
    >
        <MetaLineTickEffects>
            <div>
                {effects.slice(0, 2).map(e => AVAILABLE_EVENTS[e].shortId)}
            </div>
            {effects.length > 2 &&
                <div>+{effects.length - 2}</div>
            }
        </MetaLineTickEffects>
    </MetaLineTick>;
}
