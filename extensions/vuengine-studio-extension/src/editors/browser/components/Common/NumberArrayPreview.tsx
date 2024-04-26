import React from 'react';
import styled from 'styled-components';

const Column = styled.div`
    background-color: var(--theia-dropdown-border);
    width: 1px;
`;

const ColumnContainer = styled.div`
    align-items: end;
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    height: 32px;
    overflow: hidden;
    padding: 1px;
    user-select: none;

    &:hover {
        border-color: var(--theia-button-background);
    }
`;

interface NumberArrayPreviewProps {
    active: boolean
    maximum: number
    data: number[]
    onClick?: () => void
}

export default function NumberArrayPreview(props: NumberArrayPreviewProps): React.JSX.Element {
    const { active, maximum, data, onClick } = props;

    return <ColumnContainer
        style={{
            borderColor: active ? 'var(--theia-button-background)' : undefined,
        }}
        onClick={onClick}
    >
        {[...Array(32)].map((h, y) => {
            const v = data[y] ?? maximum;
            return <Column
                style={{
                    height: `${(v + 1) * 100 / maximum}%`
                }}
            />;
        })}
    </ColumnContainer>;
}
