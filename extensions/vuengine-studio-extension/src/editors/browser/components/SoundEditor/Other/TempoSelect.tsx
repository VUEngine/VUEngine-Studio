import React from 'react';
import BasicSelect from '../../Common/Base/BasicSelect';
import { formatTempo, getTempoOptions, snapTempo } from './tempo';

interface TempoSelectProps {
    // the duration of a 1/16 note in ms
    value: number
    timerResolution: number
    setValue: (value: number) => void
}

// the tempos the timer resolution allows, in beats per minute from slowest to fastest
export default function TempoSelect(props: TempoSelectProps): React.JSX.Element {
    const { value, timerResolution, setValue } = props;

    return (
        <BasicSelect
            options={getTempoOptions(timerResolution).reverse().map(tempo => ({
                value: tempo,
                label: formatTempo(tempo),
            }))}
            value={snapTempo(value, timerResolution)}
            onChange={e => setValue(parseInt(e.target.value))}
        />
    );
}
