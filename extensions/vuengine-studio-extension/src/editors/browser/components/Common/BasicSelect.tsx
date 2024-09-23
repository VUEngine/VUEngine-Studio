import React, { ChangeEventHandler } from 'react';

export interface BasicSelectOption {
    value: string | number | readonly string[] | undefined
    label?: string
}

interface BasicSelectProps {
    options: BasicSelectOption[]
    value: string | number | readonly string[] | undefined
    onChange: ChangeEventHandler<HTMLSelectElement> | undefined
    disabled?: boolean
}

export default function BasicSelect(props: BasicSelectProps): React.JSX.Element {
    const { options, value, onChange, disabled } = props;

    return <select
        className='theia-select'
        style={{ width: '100%' }}
        value={value}
        onChange={onChange}
        disabled={disabled}
    >
        {options.map((option, i) =>
            <option value={option.value} key={i}>
                {option.label ?? option.value}
            </option>
        )}
    </select>;
}
