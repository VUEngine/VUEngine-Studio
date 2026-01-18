import React from 'react';
import styled from 'styled-components';
import VerticalRangeInput from '../Common/Base/VerticalRangeInput';

const StyledEditor = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    user-select: none;

    > div {
        display: flex;
        gap: 2px;
        overflow-x: auto;
        padding-bottom: var(--theia-ui-padding);
    }
`;

interface EditorProps {
    mirror: boolean
    values: number[]
    setValue: (index: number, value: number) => void
}

export default function Editor(props: EditorProps): React.JSX.Element {
    const { mirror, values, setValue } = props;

    return (
        <StyledEditor>
            <div>
                {[...Array(48)].map((h, y) => {
                    const index = y;
                    const brightness = values[index] ?? 0;
                    return <VerticalRangeInput
                        key={index}
                        index={index}
                        min={1}
                        max={16}
                        maxWidth={24}
                        barHeight={320}
                        value={brightness + 1}
                        setValue={(value: number) => setValue(index, value - 1)}
                    />;
                })}
            </div>
            {
                !mirror &&
                <div>
                    {[...Array(48)].map((h, y) => {
                        const index = y + 48;
                        const brightness = values[index] ?? 0;
                        return <VerticalRangeInput
                            key={index}
                            index={index}
                            min={1}
                            max={16}
                            maxWidth={24}
                            barHeight={320}
                            value={brightness + 1}
                            setValue={(value: number) => setValue(index, value - 1)}
                        />;
                    })}
                </div>
            }
        </StyledEditor>
    );
}
