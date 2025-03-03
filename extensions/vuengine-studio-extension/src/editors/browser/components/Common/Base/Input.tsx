import { nls } from '@theia/core';
import { debounce, isInteger } from 'lodash';
import React, { FocusEventHandler, MouseEventHandler, useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';
import InfoLabel from '../InfoLabel';

interface InputProps {
    value: string | number
    setValue?: (data: string | number) => void
    type?: 'string' | 'number'
    label?: string
    tooltip?: string
    title?: string
    min?: number
    max?: number
    defaultValue?: string | number
    step?: number
    disabled?: boolean
    readOnly?: boolean
    clearable?: boolean
    commands?: string[]
    style?: object
    tabIndex?: number
    autoFocus?: boolean
    width?: number
    grow?: number
    id?: string
    className?: string
    onClick?: MouseEventHandler<HTMLInputElement>
    onBlur?: FocusEventHandler<HTMLInputElement>
}

const ClearableContainer = styled.div`
    display: inline-block;
    position: relative;

    i {
        cursor: pointer;
        display: none !important;
        position: absolute;
        right: 8px;
        top: 5px;

        &.invalid {
            color: var(--theia-focusBorder); 
            display: block !important;
            right: 20px;
        }

        &:hover {
            color: var(--theia-focusBorder);
        }
    }

    &:hover {
        i {
            display: inline-block !important;
        }
    }
`;

export default function Input(props: InputProps): React.JSX.Element {
    const {
        type,
        value, setValue, defaultValue,
        label, tooltip, title,
        min, max, step,
        disabled, readOnly, clearable,
        id, className, style, width, grow,
        tabIndex, autoFocus,
        commands,
        onClick, onBlur,
    } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [internalValue, setInternalValue] = useState<string | number>(value ?? defaultValue);
    const [invalid, setInvalid] = useState<boolean>(false);

    const isNumeric = (v: number | string): boolean => {
        if (typeof v === 'number') {
            return true;
        }
        return !isNaN(v as unknown as number) && !isNaN(parseFloat(v));
    };

    const updateInternalValue = (iv: string | number) => {
        if (type === 'number' && isNumeric(iv as unknown as number)) {
            iv = clamp(
                isInteger(step) ? parseInt(iv as string) : parseFloat(iv as string),
                Number.MIN_SAFE_INTEGER, // do not enforce min value here
                max ?? Number.MAX_SAFE_INTEGER,
                defaultValue as number ?? min ?? 0
            );
            setInternalValue(iv);
        } else {
            setInternalValue(iv);
        }

        validateAndUpdateValue(iv);
    };

    const handleOnFocus = () => {
        if (commands !== undefined && commands.length) {
            disableCommands(commands);
        }
    };

    const handleOnBlur = () => {
        if (commands !== undefined && commands.length) {
            enableCommands(commands);
        }
    };

    const validateAndUpdateValue = useCallback(debounce(
        iv => {
            if ((type === 'number' && isNumeric(iv) && (min === undefined || iv >= min))) {
                if (setValue) {
                    setValue(iv);
                }
                setInvalid(false);
            } else if (type !== 'number') {
                if (setValue) {
                    setValue((iv as string).trim());
                }
                setInvalid(false);
            } else {
                setInvalid(true);
            }
        },
        type === 'number' ? 250 : 500
    ), [setValue]);

    // resync if value is changed from the outside, e.g. through undo
    useEffect(() => {
        setInternalValue(value);
    }, [
        value
    ]);

    return (
        <VContainer grow={grow}>
            {label !== undefined &&
                <InfoLabel
                    label={label}
                    tooltip={tooltip}
                />
            }
            <div>
                <ClearableContainer
                    style={{
                        width: width ?? '100%',
                    }}
                >
                    <input
                        id={id}
                        className={`theia-input${className ? ` ${className}` : ''}`}
                        type={type}
                        min={min}
                        max={max}
                        step={step}
                        value={internalValue}
                        onChange={e => updateInternalValue(e.target.value)}
                        onFocus={handleOnFocus}
                        onBlur={e => {
                            handleOnBlur();
                            if (onBlur) {
                                onBlur(e);
                            }
                        }}
                        onClick={onClick}
                        disabled={disabled}
                        readOnly={readOnly}
                        style={{
                            boxSizing: 'border-box',
                            width: width ?? '100%',
                            ...(style ?? {})
                        }}
                        tabIndex={tabIndex}
                        autoFocus={autoFocus}
                        title={title}
                    />
                    {clearable !== false && type !== 'number' && internalValue !== '' && !disabled && !readOnly && (
                        <i
                            className="codicon codicon-x"
                            onClick={() => updateInternalValue(defaultValue as string ?? '')}
                            title={nls.localizeByDefault('Clear')}
                        />
                    )}
                    {invalid && (
                        <i
                            className="codicon codicon-warning invalid"
                            title={nls.localizeByDefault('Invalid')}
                        />
                    )}
                </ClearableContainer>
            </div>
        </VContainer>
    );
}
