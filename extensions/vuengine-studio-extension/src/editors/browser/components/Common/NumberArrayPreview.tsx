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
    min-width: 32px;
    overflow: hidden;
    padding: 1px;
    user-select: none;

    &:hover {
        border-color: var(--theia-button-background) !important;
    }
`;

interface NumberArrayPreviewProps {
    active?: boolean
    maximum: number
    data: number[]
    title?: string
    onClick?: () => void
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export default function NumberArrayPreview(props: NumberArrayPreviewProps): React.JSX.Element {
    const { active, maximum, data, title, onClick, onMouseEnter, onMouseLeave } = props;

    return <ColumnContainer
        style={{
            borderColor: active ? 'var(--theia-editor-foreground)' : undefined,
        }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={active ? 'active' : undefined}
        title={title}
    >
        {[...Array(32)].map((h, y) => {
            const v = data[y] ?? maximum;
            return <Column
                key={y}
                style={{
                    backgroundColor: active ? 'var(--theia-editor-foreground)' : undefined,
                    height: `${(v + 1) * 100 / maximum}%`
                }}
            />;
        })}
    </ColumnContainer>;
}
