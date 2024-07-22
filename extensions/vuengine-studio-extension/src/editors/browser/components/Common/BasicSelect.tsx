import React, { ChangeEventHandler } from 'react';

export interface BasicSelectOption {
    value: string | number | readonly string[] | undefined
    label: string
}

interface BasicSelectProps {
    options: BasicSelectOption[]
    value: string | number | readonly string[] | undefined
    onChange: ChangeEventHandler<HTMLSelectElement> | undefined
}

export default function BasicSelect(props: BasicSelectProps): React.JSX.Element {
    const { options, value, onChange } = props;

    return <select
        className='theia-select'
        style={{ width: '100%' }}
        value={value}
        onChange={onChange}
    >
        {options.map((option, i) =>
            <option value={option.value} key={i}>
                {option.label}
            </option>
        )}
    </select>;
}
