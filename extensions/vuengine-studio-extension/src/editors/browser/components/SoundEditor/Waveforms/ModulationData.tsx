import React from 'react';
import VerticalRangeInput from '../../Common/Base/VerticalRangeInput';
import styled from 'styled-components';

interface ModulationDataProps {
    value: number[]
    setValue: (value: number[]) => void
}

const StyledModulationData = styled.div`
    display: flex;
    flex-grow: 1;
    gap: 2px;
`;

export default function ModulationData(props: ModulationDataProps): React.JSX.Element {
    const { value, setValue } = props;

    const setIndividualValue = (index: number, v: number): void => {
        const updatedValue = [...value];
        updatedValue[index] = v;
        setValue(updatedValue);
    };

    return (
        <StyledModulationData>
            {[...Array(32)].map((h, y) => {
                const v = value[y] ?? 255;
                return <VerticalRangeInput
                    key={y}
                    index={y}
                    min={0}
                    max={255}
                    value={v}
                    setValue={(x: number) => setIndividualValue(y, x)}
                />;
            })}
        </StyledModulationData>
    );
}
