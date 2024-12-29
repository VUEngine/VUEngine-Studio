import React from 'react';
import styled from 'styled-components';

const ColumnContainer = styled.div`
    align-items: end;
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    display: flex;
    height: 32px;
    overflow: hidden;
    padding: 1px;
    position: relative;
    user-select: none;
    width: 32px;
    z-index: 1;

    &.editable {
    cursor: pointer;
    }

    &.editable:hover {
        border-color: var(--theia-button-background) !important;
    }
`;

interface NumberArrayPreviewProps {
    active?: boolean
    maximum: number
    data: number[]
    height?: number
    width?: number
    title?: string
    onClick?: () => void
    onMouseEnter?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onMouseLeave?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

export default function NumberArrayPreview(props: NumberArrayPreviewProps): React.JSX.Element {
    const { active, maximum, data, height, width, title, onClick, onMouseEnter, onMouseLeave } = props;

    return <ColumnContainer
        className={onClick ? 'editable' : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
            borderColor: active ? 'var(--theia-editor-foreground)' : undefined,
            height,
            width,
        }}
        title={title}
    >
        {[...Array(data.length)].map((h, y) => {
            const v = data[y] ?? maximum;
            return <div
                key={y}
                style={{
                    height: `${v * 100 / maximum}%`,
                    backgroundColor: active ? 'var(--theia-editor-foreground)' : 'var(--theia-dropdown-border)',
                    width: (width ?? 32) / data.length,
                }}
            />;
        })}
    </ColumnContainer>;
}
