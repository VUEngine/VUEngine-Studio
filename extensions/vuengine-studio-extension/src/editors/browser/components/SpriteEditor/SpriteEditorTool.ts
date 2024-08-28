import styled from 'styled-components';

export const SpriteEditorTool = styled.div`
    background-color: var(--theia-activityBar-background);
    box-sizing: border-box;
    justify-content: center;
    align-items: center;
    border: 2px solid transparent;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    min-height: 34px;
    min-width: 34px;

    &:hover,
    &.active {
        border-color: var(--theia-activityBar-background);
        outline: 1px solid var(--theia-button-background);
        outline-offset: -1px;
    }
`;
