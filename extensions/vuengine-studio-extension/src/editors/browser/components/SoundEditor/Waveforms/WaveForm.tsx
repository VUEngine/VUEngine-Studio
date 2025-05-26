import React from 'react';
import VerticalRangeInput from '../../Common/Base/VerticalRangeInput';
import { WAVEFORM_MAX, WAVEFORM_MIN } from '../SoundEditorTypes';
import styled from 'styled-components';

const StyledWaveform = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 320px;
    user-select: none;


    &>div {
        display: flex;
        flex-grow: 1;
        gap: 2px;
        overflow-x: auto;
        padding-bottom: var(--theia-ui-padding);
    }
`;

interface WaveFormProps {
    value: number[]
    setValue: (value: number[]) => void
    commands?: string[]
}

export default function WaveForm(props: WaveFormProps): React.JSX.Element {
    const { value, setValue, commands } = props;

    const setIndividualValue = (index: number, v: number): void => {
        const updatedValue = [...value];
        updatedValue[index] = v;
        setValue(updatedValue);
    };

    return <StyledWaveform>
        <div>
            {[...Array(32)].map((h, y) => {
                const v = value[y] ?? WAVEFORM_MAX;
                return <VerticalRangeInput
                    key={y}
                    index={y}
                    min={WAVEFORM_MIN}
                    max={WAVEFORM_MAX}
                    value={v}
                    setValue={x => setIndividualValue(y, x)}
                    commands={commands}
                />;
            })}
        </div>
    </StyledWaveform>;
}
