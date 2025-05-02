import styled from 'styled-components';
import { PATTERN_HEIGHT } from '../SoundEditorTypes';

// these need to be in a single file for references to each other to work

export const StyledSequencer = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0 var(--padding);
    min-height: calc((${PATTERN_HEIGHT}px + 2px) * 6 + 10px);
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 12px;
    position: relative;

    &.hidden {
        display: none;
    }
`;

export const StyledChannel = styled.div`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin-bottom: 1px;
    max-height: calc(${PATTERN_HEIGHT}px + 3px);

    &.muted {
        opacity: .4;
    }
`;

export const StyledPatternFill = styled.div`
    background-color: var(--theia-secondaryButton-background);
    cursor: pointer;
    flex-grow: 1;
    margin-left: 1px;
    opacity: 0;

    ${StyledChannel}:hover & {
        opacity: .1;
    }

    ${StyledChannel}.current & {
        opacity: .3;
    }
`;

export const StyledChannelHeader = styled.div`
    background-color: var(--theia-secondaryButton-background);
    border: 1px solid var(--theia-secondaryButton-background);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    height: calc(${PATTERN_HEIGHT}px + 3px);
    left: 0;
    margin-right: 2px;
    min-width: 50px;
    overflow: hidden;
    position: sticky;
    width: 52px;
    z-index: 100;

    &.current {
        background-color: var(--theia-focusBorder);
        border-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

export const StyledChannelHeaderInfo = styled.div`
    align-items: start;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3px 3px 1px;
`;

export const StyledChannelHeaderButtons = styled.div`
    display: flex;
    height: 100%;
`;

export const StyledChannelHeaderButton = styled.div`
    align-items: center;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    flex-grow: 1;

    ${StyledChannel} &:hover {
        background-color: rgba(0, 0, 0, .25);
    }
`;

export const StyledPattern = styled.div`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border: 1px solid var(--theia-secondaryButton-background);
    box-sizing: border-box;
    cursor: grab;
    display: flex;
    justify-content: center;
    margin-right: 1px;
    overflow: hidden;
    position: relative;

    &:hover,
    &.current {
        border-color: var(--theia-focusBorder);
    }
        
    &.selected {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    &.dragging {
        border: 1px solid var(--theia-focusBorder);
        cursor: grabbing;
        outline: 0;
    }
`;

export const StyledPatternName = styled.div`
    font-size: 11px;
    position: relative;
    z-index: 1;
`;

export const StyledPatternRemove = styled.div`
    cursor: pointer;
    display: none;
    height: 10px;
    line-height: 9px;
    position: absolute;
    right: 0;
    text-align: center;
    top: 0;
    width: 10px;

    ${StyledPattern}.dragging & {
        display: none !important;
    }

    ${StyledPattern}:hover & {
        display: block;
    }
`;

export const StyledAddPattern = styled.div`
    align-items: center;
    border-radius: 2px;
    border: 1px solid #333;
    box-sizing: border-box;
    color: #333;
    cursor: pointer;
    display: flex;
    justify-content: center;
    margin-right: 2px;
    min-width: 30px;
    width: 30px;

    &:hover {
        border-width: 0;
        width: unset;

        > i {
            display: none;
        }
    }
`;

export const StyledAddPatternButton = styled.div`
    align-items: center;
    background-color: transparent;
    border: var(--theia-border-width) solid var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-dropdown-border);
    cursor: pointer;
    display: flex;
    justify-content: center;
    min-width: 30px;
    width: 30px;

    &:hover {
        background-color: var(--theia-focusBorder);
        border-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    bottom: 0;
    left: 0;
    position: absolute;
    z-index: 1;
`;
