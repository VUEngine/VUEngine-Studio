import { nls } from '@theia/core';
import { debounce, isInteger } from 'lodash';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';
import InfoLabel from '../InfoLabel';

interface InputProps {
    value: string | number
    setValue: (data: string | number) => void
    type?: 'string' | 'number'
    label?: string
    tooltip?: string
    min?: number
    max?: number
    defaultValue?: string | number
    step?: number
    commands?: string[]
    style?: object
    width?: number
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
    const { value, setValue, type, label, tooltip, min, max, defaultValue, step, commands, style, width } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [internalValue, setInternalValue] = useState<string | number>(value ?? defaultValue);
    const [invalid, setInvalid] = useState<boolean>(false);

    const isNumeric = (v: number | string): boolean => {
        if (typeof v === 'number') {
            return true;
        }
        return !isNaN(v as unknown as number) && !isNaN(parseFloat(v));
    };

    const updateInternalValue = (iv: string) => {
        if (type === 'number' && isNumeric(iv as unknown as number)) {
            setInternalValue(clamp(
                isInteger(step) ? parseInt(iv) : parseFloat(iv),
                min ?? Number.MIN_SAFE_INTEGER,
                max ?? Number.MAX_SAFE_INTEGER,
                defaultValue as number ?? min ?? 0
            ));
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
            if ((type === 'number' && isNumeric(iv))) {
                setValue(iv);
                setInvalid(false);
            } else if (type !== 'number') {
                setValue((iv as string).trim());
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
        <VContainer>
            {label !== undefined &&
                <InfoLabel
                    label={label}
                    tooltip={tooltip}
                />
            }
            <div>
                <ClearableContainer>
                    <input
                        className='theia-input'
                        type={type}
                        min={min}
                        max={max}
                        step={step}
                        value={internalValue}
                        onChange={e => updateInternalValue(e.target.value)}
                        onFocus={handleOnFocus}
                        onBlur={handleOnBlur}
                        style={{
                            width,
                            ...(style ?? {})
                        }}
                    />
                    {type !== 'number' && internalValue !== '' && (
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
