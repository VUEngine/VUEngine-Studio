import { PuzzlePiece } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
    align-items: center;
    color: var(--theia-dropdown-border);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 5px;
    inset: 0;
    justify-content: center;
    position: absolute;
`;

interface EmptyContainerProps {
    title: string;
    description: string;
    onClick: () => void
}

export default function EmptyContainer(props: EmptyContainerProps): React.JSX.Element {
    const { title, description, onClick } = props;

    return <StyledContainer>
        <PuzzlePiece size={32} />
        <div
            style={{
                fontSize: '160%'
            }}
        >
            {title}
        </div>
        <div>
            {description}
        </div>
        <button
            className='theia-button secondary large'
            onClick={onClick}
            style={{
                marginTop: 20
            }}
        >
            <i className='codicon codicon-add' /> {nls.localizeByDefault('Add')}
        </button>
    </StyledContainer>;
}
