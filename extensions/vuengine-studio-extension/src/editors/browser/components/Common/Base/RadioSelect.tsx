import { deepClone } from '@theia/core';
import { HoverPosition, HoverService } from '@theia/core/lib/browser';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';

const StyledRadioSelect = styled.div`
    border-radius: 2px;
    display: flex;
    flex-direction: row;
    outline: none !important;
    user-select: none;

    & .canSelectMany {
        gap: 4px;
    }

    & .disabled {
        opacity: .5;
    }
`;

const StyledRadioSelectOption = styled.div`
    align-items: center;
    // background-color: var(--theia-secondaryButton-background);
    border: 1px solid var(--theia-dropdown-border);
    // color: var(--theia-secondaryButton-foreground);
    color: var(--theia-dropdown-border);
    cursor: pointer;
    display: flex;
    font-family: var(--theia-ui-font-family);
    font-size: var(--theia-ui-font-size1);
    height: 22px;
    justify-content: center;
    line-height: var(--theia-content-line-height);
    margin-right: -1px;
    padding: 1px 8px;
    text-align: center;
    white-space: nowrap;

    &.selected {
        // background-color: var(--theia-focusBorder);
        background-color: var(--theia-activityBar-background);
        // border-color: var(--theia-focusBorder);
        color: var(--theia-input-foreground);
        position: relative;
    }

    &:first-child {
        border-bottom-left-radius: 2px;
        border-top-left-radius: 2px;
    }

    &:last-child {
        border-bottom-right-radius: 2px;
        border-top-right-radius: 2px;
        margin-right: 0;
    }

    ${StyledRadioSelect}.disabled & {
        cursor: default;
    }

    ${StyledRadioSelect}:focus &.selected {
        // border-radius: 1px;
        outline: 1px solid var(--theia-button-background);
        // outline-offset: 1px;
    }
`;

export interface RadioSelectOption {
    value: string | number | boolean
    label?: string | ReactElement
    tooltip?: string | ReactElement
    tooltipPosition?: HoverPosition
}

interface RadioSelectProps {
    options: RadioSelectOption[]
    canSelectMany?: boolean
    allowBlank?: boolean
    defaultValue: string | number | boolean | (string | number | boolean)[]
    onChange: (options: RadioSelectOption[]) => void
    fitSpace?: boolean
    disabled?: boolean
    hoverService?: HoverService
}

export default function RadioSelect(props: RadioSelectProps): React.JSX.Element {
    const { allowBlank, options, canSelectMany, defaultValue, onChange, fitSpace, disabled, hoverService } = props;
    const { services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [currentIndexes, setCurrentIndexes] = useState<number[]>([]);
    const [classes, setClasses] = useState<string>();
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
        const c: string[] = [];
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
                updateValue([...deepClone(currentIndexes), i]);
            }
        } else {
            updateValue([i]);
        }

        enableCommands();
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
        if (disableCommands) {
            disableCommands();
        }
    };

    const handleOnBlur = () => {
        if (enableCommands) {
            enableCommands();
        }
    };

    useEffect(() => {
        getValues();
        getClasses();
    }, [
        canSelectMany,
        defaultValue,
        disabled,
    ]);

    return <StyledRadioSelect
        className={classes}
        onKeyDown={handleKeyPress}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        tabIndex={0}
    >
        {options.map((o, i) =>
            <StyledRadioSelectOption
                key={`radio-select-option-${i}`}
                className={currentIndexes.includes(i) ? 'selected' : ''}
                onClick={() => toggleValue(i)}
                style={{ flexGrow: fitSpace ? 1 : 0 }}
                onMouseEnter={event => {
                    if (o.tooltip) {
                        const hs = hoverService ? hoverService : services.hoverService;
                        let content: string | HTMLElement = o.tooltip as string;
                        if (o.tooltip && typeof o.tooltip !== 'string') {
                            content = document.createElement('div');
                            // eslint-disable-next-line no-unsanitized/property
                            content.innerHTML = renderToStaticMarkup(o.tooltip);
                        }
                        hs.requestHover({
                            content,
                            target: event.currentTarget,
                            position: o.tooltipPosition ?? 'top',
                        });
                    }
                }}
                onMouseLeave={event => {
                    if (o.tooltip) {
                        const hs = hoverService ? hoverService : services.hoverService;
                        hs.cancelHover();
                    }
                }}

            >
                {o.label ? o.label : o.value}
            </StyledRadioSelectOption>
        )}
    </StyledRadioSelect>;
}
