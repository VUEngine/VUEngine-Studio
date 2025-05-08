import styled from 'styled-components';
import { PATTERN_HEIGHT, SEQUENCER_GRID_METER_HEIGHT } from '../SoundEditorTypes';

// these need to be in a single file for references to each other to work

export const StyledSequencer = styled.div`
    display: flex;
    flex-direction: row;
    margin: 0 var(--padding);
    min-height: calc(${PATTERN_HEIGHT}px * 6 + ${SEQUENCER_GRID_METER_HEIGHT}px + 1px + 10px);
    margin-bottom: 2px;
    overflow-x: auto;
    overflow-y: hidden;
    padding-bottom: 1px;
    position: relative;

    &.hidden {
        display: none;
    }
`;

export const StyledSequencerHideToggle = styled.button`
    background-color: transparent;
    border: 0;
    box-shadow: 0 5px 0 var(--theia-editor-background) inset, 0 6px 0 inset;
    color: var(--theia-dropdown-border);
    cursor: pointer;
    font-size: 9px;
    margin: 0 12px !important;
    max-height: 12px;
    min-height: 12px !important;
    padding: 0;

    i {
        background-color: var(--theia-editor-background);
        padding: 0 var(--theia-ui-padding);
    }

    &:hover {
        background-color: var(--theia-focusBorder);
        border-radius: 2px;
        box-shadow: none;
        color: #fff;

        i {
            background-color: transparent;
        }
    }
`;

export const StyledChannelHeaderContainer = styled.div`
    border-left: 1px solid rgba(255, 255, 255, .6);
    border-right: 1px solid rgba(255, 255, 255, .6);
    display: flex;
    flex-direction: column;
    position: fixed;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-left-color: rgba(0, 0, 0, .6);
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
    background-color: #eee;
    border-bottom: 1px solid rgba(0, 0, 0, .2);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    height: ${PATTERN_HEIGHT}px;
    left: 0;
    min-width: 50px;
    overflow: hidden;
    position: sticky;
    width: 50px;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        background-color: #eee;
    }

    &.current {
        background-color: var(--theia-focusBorder) !important;
        border-color: var(--theia-focusBorder) !important;
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

    &:hover,
    &.current {
        outline: 1px solid var(--theia-focusBorder);
        outline-offset: -1px;
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

export const StyledStepIndicator = styled.div`
    background-color: var(--theia-focusBorder);
    bottom: 0;
    left: 0;
    position: absolute;
    z-index: 1;
`;

export const StyledLoopIndicator = styled.div`
    background-color: var(--theia-editor-foreground);
    bottom: 0;
    opacity: .5;
    position: absolute;
    top: 0;
    width: 1px;

    i {
        bottom: -1px;
        font-size: 9px;
        margin-left: 1px;
        position: absolute;
    }
`;
