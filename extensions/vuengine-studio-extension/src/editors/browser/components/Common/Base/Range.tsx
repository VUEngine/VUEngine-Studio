import React, { ChangeEventHandler, PropsWithChildren, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { clamp } from '../Utils';
import BasicSelect, { BasicSelectOption } from './BasicSelect';
import HContainer from './HContainer';
import Input from './Input';

interface RangeProps {
    min: number
    max: number
    step?: number
    value: number
    options?: BasicSelectOption[]
    setValue: (value: number) => void
    commandsToDisable?: string[]
    width?: string | number
}

export default function Range(props: PropsWithChildren<RangeProps>): React.JSX.Element {
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { min, max, step, value, options, setValue, commandsToDisable, width } = props;

    let inputWidth = 32;
    if (!Number.isInteger(step)) {
        inputWidth = 52;
    } else if (max >= 1000) {
        inputWidth = 48;
    } else if (max >= 100) {
        inputWidth = 40;
    }

    const onChange: ChangeEventHandler<HTMLInputElement> = e => {
        const v =
            !e.currentTarget.value
                ? min
                : Number.isInteger(e.currentTarget.value)
                    ? parseInt(e.currentTarget.value)
                    : parseFloat(e.currentTarget.value);
        setValue(clamp(v, min, max));
    };

    return <HContainer alignItems="center" style={{ width }}>
        <input
            type="range"
            className={`value-${Math.round(100 / (max - min) * (value ?? max))}`}
            style={{ flexGrow: 1 }}
            min={min}
            max={max}
            step={step}
            value={value ?? max}
            onChange={onChange}
            onFocus={() => { if (commandsToDisable) { disableCommands(commandsToDisable); } }}
            onBlur={() => { if (commandsToDisable) { enableCommands(commandsToDisable); } }}
        />
        {
            options
                ? <BasicSelect
                    options={options}
                    style={{ width: 'unset' }}
                    value={value ?? max}
                    onChange={onChange as unknown as React.ChangeEventHandler<HTMLSelectElement>}
                    onFocus={() => { if (commandsToDisable) { disableCommands(commandsToDisable); } }}
                    onBlur={() => { if (commandsToDisable) { enableCommands(commandsToDisable); } }}
                />
                : <Input
                    type="number"
                    style={{ minWidth: inputWidth, width: inputWidth }}
                    value={value ?? max}
                    setValue={setValue}
                    min={min}
                    max={max}
                    step={step}
                    commands={commandsToDisable}
                />
        }
    </HContainer>;
}

