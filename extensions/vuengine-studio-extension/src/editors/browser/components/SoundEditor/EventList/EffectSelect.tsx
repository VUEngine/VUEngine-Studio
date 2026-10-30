import React from 'react';
import BasicSelect from '../../Common/Base/BasicSelect';

interface EffectSelectProps {
    value: number
    values: number[]
    format: (value: number) => string
    setValue: (value: number) => void
}

export default function EffectSelect(props: EffectSelectProps): React.JSX.Element {
    const { value, values, format, setValue } = props;

    // keep a value which is not among the options selectable, e.g. one set before the options changed
    const options = values.includes(value)
        ? values
        : [...values, value].sort((a, b) => a - b);

    return (
        <BasicSelect
            options={options.map(v => ({
                value: v,
                label: format(v),
            }))}
            value={value}
            title={format(value)}
            onChange={e => setValue(parseInt(e.target.value))}
        />
    );
}
