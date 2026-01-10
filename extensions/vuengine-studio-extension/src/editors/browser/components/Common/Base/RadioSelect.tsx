import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';

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
    fitSpace?: boolean
    disabled?: boolean
}

export default function RadioSelect(props: RadioSelectProps): React.JSX.Element {
    const { allowBlank, options, canSelectMany, defaultValue, onChange, fitSpace, disabled } = props;
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [currentIndexes, setCurrentIndexes] = useState<number[]>([]);
    const [classes, setClasses] = useState<string>('radioSelect');
    const numberOfOptions = options.length;

    const getValues = () => {
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
        setCurrentIndexes(defaultValueIndexes);
    };

    const getClasses = () => {
        const c: string[] = ['radioSelect'];
        if (canSelectMany) {
            c.push('canSelectMany');
        }
        if (disabled) {
            c.push('disabled');
        }
        setClasses(c.join(' '));
    };

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
        if (disabled) {
            return;
        }

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

    const handleOnFocus = () => {
        disableCommands();
    };

    const handleOnBlur = () => {
        enableCommands();
    };

    useEffect(() => {
        getValues();
        getClasses();
    }, [
        canSelectMany,
        defaultValue,
        disabled,
    ]);

    return <div
        className={classes}
        onKeyDown={handleKeyPress}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        tabIndex={0}
    >
        {options.map((o, i) =>
            <div
                key={`radio-select-option-${i}`}
                className={currentIndexes.includes(i) ? 'selected' : ''}
                onClick={() => toggleValue(i)}
                style={{ flexGrow: fitSpace ? 1 : 0 }}
            >
                {o.label ? o.label : o.value}
            </div>
        )}
    </div>;
}
