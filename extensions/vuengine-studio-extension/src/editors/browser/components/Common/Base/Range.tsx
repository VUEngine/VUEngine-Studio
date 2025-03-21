import React, { PropsWithChildren, useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { clamp } from '../Utils';
import AdvancedSelect, { AdvancedSelectOption } from './AdvancedSelect';
import { BasicSelectOption } from './BasicSelect';
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
    selectWidth?: number
}

export default function Range(props: PropsWithChildren<RangeProps>): React.JSX.Element {
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { min, max, step, value, options, setValue, commandsToDisable, width, selectWidth } = props;

    let inputWidth = 32;
    if (!Number.isInteger(step)) {
        inputWidth = 52;
    } else if (max >= 1000) {
        inputWidth = 48;
    } else if (max >= 100) {
        inputWidth = 40;
    }

    const onChange = (val: string) => {
        const v = !val
            ? min
            : Number.isInteger(val)
                ? parseInt(val)
                : parseFloat(val);
        setValue(clamp(v, min, max));
    };

    return <HContainer alignItems="center" style={{ width }}>
        <input
            type="range"
            className={`value-${Math.floor(100 / (max - min) * ((value ?? max) - min))}`}
            style={{ flexGrow: 1 }}
            min={min}
            max={max}
            step={step}
            value={value ?? max}
            onChange={e => onChange(e.target.value)}
            onFocus={() => { if (commandsToDisable) { disableCommands(commandsToDisable); } }}
            onBlur={() => { if (commandsToDisable) { enableCommands(commandsToDisable); } }}
        />
        {
            options
                ? <AdvancedSelect
                    options={options.map(o => ({
                        ...o,
                        value: o.value?.toString(),
                    })) as AdvancedSelectOption[]}
                    defaultValue={value?.toString() ?? max?.toString()}
                    onChange={opts => onChange(opts[0])}
                    commands={commandsToDisable}
                    width={selectWidth}
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

