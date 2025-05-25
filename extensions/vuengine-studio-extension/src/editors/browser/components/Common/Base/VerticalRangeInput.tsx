import React from 'react';
import styled from 'styled-components';
import { clamp } from '../Utils';
import Input from './Input';

const Column = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 2px;
    min-width: 24px;
`;

const Index = styled.div`
    align-items: center;
    display: flex;
    font-size: 10px;
    justify-content: center;
    line-height: 14px;
    opacity: .5;
`;

const BarContainer = styled.div`
    background-image: repeating-linear-gradient(to bottom, transparent, transparent 50%, rgba(0, 0, 0, .2) 50%, rgba(0, 0, 0, .2));
    border: var(--theia-border-width) solid var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    cursor: pointer;
    flex-grow: 1;
    overflow: hidden;
    position: relative;
    width: 100%;

    &:hover {
        border-color: var(--theia-focusBorder)
    }
`;

const Bar = styled.div`
    background-color: var(--theia-editor-foreground);
    bottom: 0;
    height: 0;
    position: absolute;
    width: 100%;
    transition: height .1s;
`;

const StyledInput = styled(Input)`
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
            const v = clamp(Math.round(max - (y / step)), min, max);
            setValue(v);
        }
    };

    return <Column style={{ maxWidth }}>
        <Index>
            {index + 1}
        </Index>
        <BarContainer
            onMouseDown={onMouse}
            onMouseMoveCapture={onMouse}
            style={{
                backgroundSize: `100% calc(100% / ${max / 2})`,
                height: barHeight,
            }}
        >
            <Bar
                style={{ height: `${value / max * 100}%` }}
            />
        </BarContainer>
        <StyledInput
            className='theia-input'
            type='number'
            min={min}
            max={max}
            value={value ?? min}
            setValue={setValue}
            onClick={handleSelectInput}
        />
    </Column>;
}
