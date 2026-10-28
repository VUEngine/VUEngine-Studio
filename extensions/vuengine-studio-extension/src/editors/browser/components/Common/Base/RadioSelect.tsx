import { deepClone } from '@theia/core';
import { HoverPosition, HoverService } from '@theia/core/lib/browser';
import React, { ReactElement, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';

const StyledRadioSelect = styled.div`
    background: var(--theia-editor-background);
    border: 1px solid var(--theia-secondaryButton-background);
    border-radius: 6px;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    gap: 2px;
    outline: none !important;
    padding: 2px;
    position: relative;
    user-select: none;

    &.canSelectMany {
        gap: 4px;
    }

    &.disabled {
        opacity: .5;
    }

    &:hover,
    &:focus {
        border-color: var(--theia-button-background);
    }
`;

const StyledThumb = styled.div`
    background-color: var(--theia-secondaryButton-background);
    border-radius: var(--theia-border-radius, 3px);
    bottom: 2px;
    box-shadow: 0 1px 2px var(--theia-widget-shadow);
    left: 0;
    position: absolute;
    top: 2px;
    transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1),
                width 200ms cubic-bezier(0.32, 0.72, 0, 1);
`;

const StyledRadioSelectOption = styled.div`
    align-items: center;
    border-radius: var(--theia-border-radius, 3px);
    box-sizing: border-box;
    color: var(--theia-descriptionForeground);
    cursor: pointer;
    display: flex;
    font-family: var(--theia-ui-font-family);
    font-size: var(--theia-ui-font-size1);
    height: 24px;
    justify-content: center;
    line-height: 1;
    padding: 0 var(--theia-ui-padding);
    position: relative;
    text-align: center;
    transition: color 120ms ease;
    white-space: nowrap;
    z-index: 1;

    &:hover {
        color: var(--theia-foreground);
    }

    &.selected {
        color: var(--theia-list-activeSelectionForeground);
    }

    ${StyledRadioSelect}.no-thumb &.selected {
        background-color: var(--theia-secondaryButton-background);
        box-shadow: 0 1px 2px var(--theia-widget-shadow);
    }

    ${StyledRadioSelect}.disabled & {
        cursor: default;
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

function indexesOf(
    value: string | number | boolean | (string | number | boolean)[],
    options: RadioSelectOption[],
): number[] {
    const wanted = Array.isArray(value) ? value : [value];
    const found: number[] = [];
    options.forEach((o, i) => {
        if (wanted.includes(o.value)) {
            found.push(i);
        }
    });
    return found;
}

export default function RadioSelect(props: RadioSelectProps): React.JSX.Element {
    const { allowBlank, options, canSelectMany, defaultValue, onChange, fitSpace, disabled, hoverService } = props;
    const { services, disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [currentIndexes, setCurrentIndexes] = useState<number[]>(() => indexesOf(defaultValue, options));
    const [classes, setClasses] = useState<string>();
    const numberOfOptions = options.length;

    const containerRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [thumb, setThumb] = useState<{ x: number, w: number } | null>(null);
    const [animate, setAnimate] = useState(false);

    const soleIndex = !canSelectMany && currentIndexes.length === 1 ? currentIndexes[0] : -1;

    const placeThumb = useCallback(() => {
        const container = containerRef.current;
        const option = soleIndex >= 0 ? optionRefs.current[soleIndex] : null;
        if (!container || !option) {
            setThumb(null);
            return;
        }
        const c = container.getBoundingClientRect();
        const o = option.getBoundingClientRect();
        setThumb({ x: o.left - c.left - container.clientLeft, w: o.width });
    }, [soleIndex]);

    useLayoutEffect(placeThumb, [placeThumb, options, fitSpace, canSelectMany]);

    useEffect(() => {
        if (thumb && !animate) {
            const id = requestAnimationFrame(() => setAnimate(true));
            return () => cancelAnimationFrame(id);
        }
        return undefined;
    }, [thumb, animate]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }
        const observer = new ResizeObserver(() => placeThumb());
        observer.observe(container);
        return () => observer.disconnect();
    }, [placeThumb]);

    const getValues = () => {
        setCurrentIndexes(indexesOf(defaultValue, options));
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

        enableCommands?.();
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
        disableCommands?.();
    };

    const handleOnBlur = () => {
        enableCommands?.();
    };

    useEffect(() => {
        getValues();
        getClasses();
    }, [
        canSelectMany,
        defaultValue,
        disabled,
    ]);

    const showThumb = soleIndex >= 0 && thumb !== null;

    return <StyledRadioSelect
        ref={containerRef}
        className={[classes, soleIndex < 0 ? 'no-thumb' : undefined].filter(Boolean).join(' ')}
        style={{ width: fitSpace ? undefined : 'max-content' }}
        onKeyDown={handleKeyPress}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        tabIndex={0}
    >
        {showThumb && thumb &&
            <StyledThumb style={{
                transform: `translateX(${thumb.x}px)`,
                width: `${thumb.w}px`,
                transition: animate ? undefined : 'none',
            }} />}
        {options.map((o, i) =>
            <StyledRadioSelectOption
                key={`radio-select-option-${i}`}
                ref={el => { optionRefs.current[i] = el; }}
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
