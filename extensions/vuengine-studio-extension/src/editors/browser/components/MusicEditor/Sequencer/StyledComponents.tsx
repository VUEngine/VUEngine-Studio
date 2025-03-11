import styled from 'styled-components';
import { CHANNEL_BG_COLORS, PATTERN_HEIGHT } from '../MusicEditorTypes';

// these need to be in a single fine for references to each other to work

export const StyledSequencer = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0 var(--padding);
    min-height: calc((${PATTERN_HEIGHT}px + 1px) * 6 + 10px);
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
`;

export const StyledChannel = styled.div`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    margin-bottom: 1px;
    max-height: ${PATTERN_HEIGHT}px;

    &.muted {
        opacity: .4;
    }
`;

export const StyledPatternFill = styled.div`
    background-color: var(--theia-secondaryButton-background);
    border-radius: 2px;
    cursor: pointer;
    flex-grow: 1;
    opacity: 0;

    ${StyledChannel}:hover & {
        opacity: .1;
    }
`;

export const StyledChannelHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-radius: 2px;
    color: var(--theia-secondaryButton-foreground);
    display: flex;
    flex-direction: row;
    font-size: 10px;
    font-weight: bold;
    height: ${PATTERN_HEIGHT}px;
    left: 0;
    margin-right: 2px;
    min-width: 50px;
    overflow: hidden;
    padding-right: 1px;
    position: sticky;
    width: 50px;
    z-index: 100;
`;

export const StyledChannelHeaderInfo = styled.div`
    align-items: start;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 5px;
    width: 26px;

    ${StyledChannel}:nth-child(1) & {
        background-color: ${CHANNEL_BG_COLORS[0]}85;
    }
    ${StyledChannel}:nth-child(1):hover & {
        background-color: ${CHANNEL_BG_COLORS[0]};
    }
    ${StyledChannel}:nth-child(2) & {
        background-color: ${CHANNEL_BG_COLORS[1]}85;
    }
    ${StyledChannel}:nth-child(2):hover & {
        background-color: ${CHANNEL_BG_COLORS[1]};
    }
    ${StyledChannel}:nth-child(3) & {
        background-color: ${CHANNEL_BG_COLORS[2]}85;
    }
    ${StyledChannel}:nth-child(3):hover & {
        background-color: ${CHANNEL_BG_COLORS[2]};
    }
    ${StyledChannel}:nth-child(4) & {
        background-color: ${CHANNEL_BG_COLORS[3]}85;
    }
    ${StyledChannel}:nth-child(4):hover & {
        background-color: ${CHANNEL_BG_COLORS[3]};
    }
    ${StyledChannel}:nth-child(5) & {
        background-color: ${CHANNEL_BG_COLORS[4]}85;
    }
    ${StyledChannel}:nth-child(5):hover & {
        background-color: ${CHANNEL_BG_COLORS[4]};
    }
    ${StyledChannel}:nth-child(6) & {
        background-color: ${CHANNEL_BG_COLORS[5]}85;
    }
    ${StyledChannel}:nth-child(6):hover & {
        background-color: ${CHANNEL_BG_COLORS[5]};
    }

    ${StyledChannelHeader}.current & {
        background-color: var(--theia-focusBorder) !important;
        color: #fff;
    }
`;

export const StyledChannelHeaderButtons = styled.div`
    display: flex;
    font-size: 10px;
    height: 100%;

    ${StyledChannel}:nth-child(1) & {
        background-color: ${CHANNEL_BG_COLORS[0]}85;
    }
    ${StyledChannel}:nth-child(1):hover & {
        background-color: ${CHANNEL_BG_COLORS[0]};
    }
    ${StyledChannel}:nth-child(2) & {
        background-color: ${CHANNEL_BG_COLORS[1]}85;
    }
    ${StyledChannel}:nth-child(2):hover & {
        background-color: ${CHANNEL_BG_COLORS[1]};
    }
    ${StyledChannel}:nth-child(3) & {
        background-color: ${CHANNEL_BG_COLORS[2]}85;
    }
    ${StyledChannel}:nth-child(3):hover & {
        background-color: ${CHANNEL_BG_COLORS[2]};
    }
    ${StyledChannel}:nth-child(4) & {
        background-color: ${CHANNEL_BG_COLORS[3]}85;
    }
    ${StyledChannel}:nth-child(4):hover & {
        background-color: ${CHANNEL_BG_COLORS[3]};
    }
    ${StyledChannel}:nth-child(5) & {
        background-color: ${CHANNEL_BG_COLORS[4]}85;
    }
    ${StyledChannel}:nth-child(5):hover & {
        background-color: ${CHANNEL_BG_COLORS[4]};
    }
    ${StyledChannel}:nth-child(6) & {
        background-color: ${CHANNEL_BG_COLORS[5]}85;
    }
    ${StyledChannel}:nth-child(6):hover & {
        background-color: ${CHANNEL_BG_COLORS[5]};
    }
`;

export const StyledChannelHeaderButton = styled.div`
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: center;
    flex-grow: 1;
    width: 12px;

    ${StyledChannel} &:hover,
    ${StyledChannel} &.active {
        background-color: var(--theia-editor-background);
        color: #fff;
    }

    ${StyledChannelHeader}.current & {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }

    ${StyledChannelHeader}.current &:hover {
        background-color: var(--theia-button-hoverBackground);
    }
`;

export const StyledPattern = styled.div`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border: 1px solid transparent;
    border-radius: 2px;
    box-sizing: border-box;
    cursor: grab;
    display: flex;
    justify-content: center;
    margin-right: 1px;
    overflow: hidden;
    position: relative;

    ${StyledChannel}:hover & {
        background-color: var(--theia-secondaryButton-hoverBackground);
    }

    &:hover,
    &.current {
        border-color: var(--theia-focusBorder);
    }

    &.dragging {
        border: 1px solid var(--theia-focusBorder);
        cursor: grabbing;
        outline: 0;
    }
`;

export const StyledPatternRemove = styled.div`
    background-color: var(--theia-secondaryButton-hoverBackground);
    cursor: pointer;
    display: none;
    position: absolute;
    right: 0;
    text-align: center;
    top: 0;
    width: 14px;
    bottom: 0;
    line-height: 17px;

    ${StyledPattern}.dragging & {
        display: none !important;
    }

    ${StyledPattern} &:hover {
        background-color: var(--theia-focusBorder);
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
    min-width: 23px;
    width: 23px;

    &:hover {
        border-width: 0;
        width: unset;

        > i {
            display: none;
        }
    }
`;

export const StyledAddPatternPatternSelect = styled.div`
    display: none;
    flex-direction: row;
    gap: 1px;
    height: 100%;

    ${StyledAddPattern}:hover & {
        display: flex;
    }
`;

export const StyledAddPatternExisting = styled.div`
    display: flex;
    flex-grow: 1;
    gap: 1px;
`;

export const StyledAddPatternButton = styled.div`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border-radius: 2px;
    border: 0;
    color: var(--theia-secondaryButton-foreground);
    cursor: pointer;
    display: flex;
    font-size: 12px;
    height: 100%;
    justify-content: center;
    min-height: unset;
    min-width: 16px;
    padding: 0;
    width: 16px;

    &:hover {
        background-color: var(--theia-button-background) !important;
    }
`;

export const StyledAddPatternNewPatternButton = styled(StyledAddPatternButton)`
    min-width: 23px;
    width: 23px;
`;

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    bottom: 0;
    left: 0;
    position: absolute;
    z-index: 1;
`;
