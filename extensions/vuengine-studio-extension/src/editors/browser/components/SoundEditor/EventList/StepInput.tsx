import React from 'react';
import Input from '../../Common/Base/Input';
import {
    EventsMap,
    SUB_NOTE_RESOLUTION
} from '../SoundEditorTypes';

interface StepInputProps {
    patternSize: number
    patternStepOffset: number
    label?: string
    width?: number
    step: number
    events: EventsMap
    noteSnapping: boolean
    setNotes: (notes: EventsMap) => void
    setNoteCursor: (step: number) => void
}

export default function StepInput(props: StepInputProps): React.JSX.Element {
    const { patternSize, patternStepOffset, label, width, step, events, noteSnapping, setNotes, setNoteCursor } = props;

    return (
        <Input
            label={label}
            type='number'
            min={0}
            max={patternSize * SUB_NOTE_RESOLUTION - 1}
            step={noteSnapping ? SUB_NOTE_RESOLUTION : 1}
            value={step}
            setValue={v => {
                // remove all events from the previous step
                setNotes({
                    [step]: Object.fromEntries(Object.keys(events).map(e => [e, undefined])),
                    [v]: {
                        ...events
                    }
                });
                setNoteCursor((v as number) + patternStepOffset * SUB_NOTE_RESOLUTION);
            }}
            width={width}
        />
    );
}
