import React from 'react';
import styled from 'styled-components';
import { clamp } from './Utils';

interface ColumnProps {
    maxWidth?: number
}

const Column = styled.div<ColumnProps>`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 2px;
    ${p => p.maxWidth ? `max-width: ${p.maxWidth}px;` : ''}
    min-width: 24px;
`;

const Index = styled.div`
    align-items: center;
    color: var(--theia-input-background);
    display: flex;
    font-size: 8px;
    justify-content: center;
    line-height: 14px;
`;

interface BarContainerProps {
    height?: number
    steps: number
}

const BarContainer = styled.div<BarContainerProps>`
    background-image: repeating-linear-gradient(to bottom, transparent, transparent 50%, rgba(0, 0, 0, .2) 50%, rgba(0, 0, 0, .2));
    background-size: 100% calc(100% / ${p => p.steps / 2});
    border: var(--theia-border-width) solid var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    cursor: pointer;
    flex-grow: 1;
    ${p => p.height ? `height: ${p.height}px;` : ''}
    overflow: hidden;
    position: relative;
    width: 100%;

    &:hover {
        border-color: var(--theia-focusBorder)
    }
`;

const Bar = styled.div`
    background-color: var(--theia-dropdown-border);
    bottom: 0;
    height: 0;
    position: absolute;
    width: 100%;
    transition: height .1s;
`;

const Input = styled.input`
    box-sizing: border-box;
    font-size: 12px;
    min-width: 24px !important;
    padding: 0;
    text-align: center;

    &:hover {
        border-color: var(--theia-focusBorder)
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

interface VerticalRangeInputProps {
    index: number
    min: number
    max: number
    maxWidth?: number
    barHeight?: number
    value: number
    setValue: (value: number) => void
}

export default function VerticalRangeInput(props: VerticalRangeInputProps): React.JSX.Element {
    const { index, min, max, maxWidth, barHeight, value, setValue } = props;

    const handleSelectInput = (event: React.MouseEvent) =>
        // @ts-ignore
        event.currentTarget.select();

    const onMouse = (e: React.MouseEvent) => {
        if (e.buttons === 1) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const step = rect.height / max;
            const v = clamp(Math.ceil(max - (y / step)), min, max);
            setValue(v);
        }
    };

    return <Column maxWidth={maxWidth}>
        <Index>
            {index + 1}
        </Index>
        <BarContainer
            steps={max}
            height={barHeight}
            onMouseDown={onMouse}
            onMouseMoveCapture={onMouse}
        >
            <Bar
                style={{ height: `${value / max * 100}%` }}
            />
        </BarContainer>
        <Input
            className='theia-input'
            type='number'
            step='1'
            min={min}
            max={max}
            value={value ?? min}
            onClick={handleSelectInput}
            onChange={e => setValue(
                clamp(parseInt(e.target.value === '' ? `${min}` : e.target.value), min, max)
            )}
        />
    </Column>;
}
