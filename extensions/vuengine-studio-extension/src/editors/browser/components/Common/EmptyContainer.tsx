import { PuzzlePiece } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { ReactElement } from 'react';
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
    description?: string;
    icon?: ReactElement;
    onClick?: () => void
}

export default function EmptyContainer(props: EmptyContainerProps): React.JSX.Element {
    const { title, description, icon, onClick } = props;

    return <StyledContainer>
        {icon ? icon : <PuzzlePiece size={32} />}
        <div
            style={{
                fontSize: '160%'
            }}
        >
            {title}
        </div>
        {description &&
            <div>
                {description}
            </div>
        }
        {onClick &&
            <button
                className='theia-button secondary large'
                onClick={onClick}
                style={{
                    marginTop: 20
                }}
            >
                <i className='codicon codicon-add' /> {nls.localizeByDefault('Add')}
            </button>
        }
    </StyledContainer>;
}
