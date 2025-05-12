import styled from 'styled-components';
import { PATTERN_HEIGHT, PIANO_ROLL_KEY_WIDTH, SEQUENCER_GRID_METER_HEIGHT } from '../SoundEditorTypes';

// these need to be in a single file for references to each other to work

export const StyledChannelHeaderContainer = styled.div`
    border-right: 1px solid rgba(255, 255, 255, .6);
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-right-color: rgba(0, 0, 0, .6);
    }
`;

export const StyledChannelsHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    height: ${SEQUENCER_GRID_METER_HEIGHT}px;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }
`;

export const StyledChannelHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .2);
    border-left: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    height: ${PATTERN_HEIGHT}px;
    left: 0;
    min-width: ${PIANO_ROLL_KEY_WIDTH}px;
    overflow: hidden;
    position: sticky;
    width: ${PIANO_ROLL_KEY_WIDTH + 1}px;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .2);
        border-left-color: rgba(0, 0, 0, .6);
    }

    &.current {
        background-color: var(--theia-focusBorder) !important;
        color: #fff;
    }

    ${StyledChannelHeaderContainer} &:last-child {
        border-bottom-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-bottom-color: rgba(0, 0, 0, .4);
        }
    }
`;

export const StyledChannelHeaderInfo = styled.div`
    align-items: start;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 3px 3px 1px;
`;

export const StyledChannelHeaderButtons = styled.div`
    display: flex;
    height: 100%;
    justify-content: space-between;
    margin: 0 0 1px 1px;
`;

export const StyledChannelHeaderButtonsGroup = styled.div`
    display: flex;
`;

export const StyledChannelHeaderButton = styled.div`
    align-items: center;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    flex-grow: 1;
    width: 16px;

    &:hover {
        background: rgba(0, 0, 0, .2);
    }
`;

export const StyledPattern = styled.div`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border-right: 1px solid rgba(255, 255, 255, .1);
    border-bottom: 1px solid rgba(255, 255, 255, .1);
    box-sizing: border-box;
    cursor: ew-resize;
    display: flex;
    height: ${PATTERN_HEIGHT}px;
    justify-content: center;
    margin-right: 1px;
    overflow: hidden;
    position: absolute;
    z-index: 10;

    &:hover,
    &.current {
        outline: 1px solid var(--theia-focusBorder);
        outline-offset: -1px;
        z-index: 11;
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

    canvas {
        box-sizing: border-box;
        height: ${PATTERN_HEIGHT}px;
    }

    .react-resizable-handle {
        border-left: 1px solid rgba(255, 255, 255, .5);
        bottom: 3px;
        cursor: col-resize;
        position: absolute;
        right: 0;
        top: 3px;
        width: 2px;
        z-index: 10;
    }
`;

export const StyledPatternName = styled.div`
    align-items: center;
    display: flex;
    font-size: 9px;
    height: 100%;
    justify-content: center;
    overflow: hidden;
    padding: 0 3px;
    position: relative;
    text-overflow: ellipsis;
    z-index: 1;
`;

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    left: 0;
    position: absolute;
    top: 0;
    width: 1px;
    z-index: 250;

    &:before {
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
        border-top: 9px solid var(--theia-focusBorder);
        content: '';
        display: block;
        height: 0;
        margin-left: -4px;
        position: sticky;
        top: 0;
        width: 1px;
    }
`;

export const StyledLoopIndicator = styled.div`
    background-color: var(--theia-editor-foreground);
    bottom: 12px;
    opacity: .5;
    position: absolute;
    top: 0;
    width: 1px;

    i {
        font-size: 9px;
        margin-left: 1px;
        position: absolute;
        top: 4px;
    }
`;
