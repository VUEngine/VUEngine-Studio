import React, { useState } from 'react';

export interface RadioSelectOption {
    value: string | number | boolean
    label?: string
}

interface RadioSelectProps {
    options: RadioSelectOption[]
    canSelectMany?: boolean
    allowBlank?: boolean
    defaultValue: string | number | boolean | (string | number | boolean)[]
    onChange: (options: RadioSelectOption[]) => void
}

export default function RadioSelect(props: RadioSelectProps): React.JSX.Element {
    const { allowBlank, options, canSelectMany, defaultValue, onChange } = props;

    const numberOfOptions = options.length;

    let defaultValueArray: (string | number | boolean)[] = [];
    if (!Array.isArray(defaultValue)) {
        defaultValueArray = [defaultValue];
    } else {
        defaultValueArray = defaultValue;
    }
    const defaultValueIndexes: number[] = [];
    options.map((o, i) => {
        if (defaultValueArray.includes(o.value)) {
            defaultValueIndexes.push(i);
        }
    });

    const [currentIndexes, setCurrentIndexes] = useState<number[]>(defaultValueIndexes);

    const classes: string[] = ['radioSelect'];
    if (canSelectMany) {
        classes.push('canSelectMany');
    }

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (!canSelectMany && e.key === 'ArrowLeft') {
            if (currentIndexes[0] === 0) {
                updateValue([numberOfOptions - 1]);
            } else {
                updateValue([currentIndexes[0] - 1]);
            }
        } else if (!canSelectMany && e.key === 'ArrowRight') {
            if (currentIndexes[0] === numberOfOptions - 1) {
                updateValue([0]);
            } else {
                updateValue([currentIndexes[0] + 1]);
            }
        } else if (canSelectMany && e.key === 'ArrowUp') {
            // select all
            const allIndexes: number[] = [];
            [...Array(numberOfOptions)].map((i, c) => {
                allIndexes.push(c);
            });
            updateValue(allIndexes);
        } else if (canSelectMany && e.key === 'ArrowDown') {
            // deselect all
            updateValue([]);
        }
    };

    const toggleValue = (i: number): void => {
        if (canSelectMany) {
            if (currentIndexes.includes(i)) {
                updateValue(currentIndexes.filter(ci => ci !== i));
            } else {
                updateValue([...currentIndexes, i]);
            }
        } else {
            updateValue([i]);
        }
    };

    const updateValue = (i: number[]): void => {
        if (!allowBlank && i.length === 0) {
            return;
        }

        setCurrentIndexes(i);
        const updatedOptions: RadioSelectOption[] = [];
        i.map(n => {
            updatedOptions.push(options[n]);
        });
        onChange(updatedOptions);
    };

    return <div className={classes.join(' ')} onKeyDown={handleKeyPress} tabIndex={0}>
        {options.map((o, i) =>
            <div
                key={`radio-select-option-${i}`}
                className={currentIndexes.includes(i) ? 'selected' : undefined}
                onClick={() => toggleValue(i)}
            >
                {o.label ? o.label : o.value}
            </div>
        )}
    </div>;
}
