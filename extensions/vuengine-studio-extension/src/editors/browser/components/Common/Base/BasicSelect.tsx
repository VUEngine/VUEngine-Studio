import React, { ChangeEventHandler, FocusEventHandler } from 'react';

export interface BasicSelectOption {
    value: string | number | readonly string[] | undefined
    label?: string
    disabled?: boolean
}

interface BasicSelectProps {
    options: BasicSelectOption[]
    value: string | number | readonly string[] | undefined
    onChange: ChangeEventHandler<HTMLSelectElement> | undefined
    onFocus?: FocusEventHandler<HTMLSelectElement> | undefined
    onBlur?: FocusEventHandler<HTMLSelectElement> | undefined
    disabled?: boolean
    style?: object
}

export default function BasicSelect(props: BasicSelectProps): React.JSX.Element {
    const { options, value, onChange, onFocus, onBlur, disabled, style } = props;

    return <select
        className='theia-select'
        style={{ width: '100%', ...style }}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={disabled}
    >
        {options.map((option, i) =>
            <option value={option.value} key={i} disabled={option.disabled === true}>
                {option.label ?? option.value}
            </option>
        )}
    </select>;
}
