import styled from 'styled-components';
import { PIANO_ROLL_KEY_WIDTH, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';

// these need to be in a single fine for references to each other to work

export const MetaLine = styled.div`
    background: var(--theia-editor-background);
    border-top: 0px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    position: sticky;
    transition: all .2s;
    z-index: 200;

    body.theia-light &,
    body.theia-hc & {
        border-top-color: rgba(0, 0, 0, .6);
    }
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .4);
    border-right: 1px solid rgba(255, 255, 255, .4);
    border-top: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    left: 0;
    max-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    position: sticky;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .4);
        border-right-color: rgba(0, 0, 0, .4);
    }

    ${MetaLine}:last-child & {
        border-bottom-color: transparent;
        border-top-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-top-color: rgba(0, 0, 0, .4);
        }
    }
`;

export const MetaLineTick = styled.div`
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, .4);
    border-right: 1px solid rgba(255, 255, 255, .1);
    border-top: 1px solid rgba(255, 255, 255, .4);
    box-sizing: border-box;
    cursor: ew-resize;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 1px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    max-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    position: relative;
    user-select: none;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .4);
        border-right-color: rgba(0, 0, 0, .1);
        border-top-color: rgba(0, 0, 0, .4);
    }

    &:hover {
        background-color: var(--theia-focusBorder) !important;
        color: #fff;
    }
    &:nth-child(4n + 1) {
        border-right-color: rgba(255, 255, 255, .2);

        body.theia-light &,
        body.theia-hc & {
            border-right-color: rgba(0, 0, 0, .2);
        }
    }

    ${MetaLine}:last-child & {
        border-bottom-color: transparent;
    }
`;

export const MetaLineTickEffects = styled.div`
    align-items: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: center;
    overflow: hidden;
    width: 100%;    
    
    ${MetaLineTick}.current & {
        background-color: var(--theia-secondaryButton-hoverBackground);

        &:hover {
            background-color: var(--theia-focusBorder);
            color: #fff;
        }
    }
`;

export const StyledPianoRollHeaderTick = styled(MetaLineTick)`
    border-top-color: transparent !important;
    color: var(--theia-secondaryButton-background);
    min-height: 16px;

    &.rangeStart, &.rangeEnd, &.inRange {
        border-top-color: var(--theia-focusBorder) !important;
    }
    
    &.rangeStart::before {
        border-right: 10px solid transparent;
        border-top: 10px solid var(--theia-focusBorder);
        content: "";
        top: 0;
        position: absolute;
        left: 0;
        z-index: 1;
    }

    &.rangeEnd::after {
        border-left: 10px solid transparent;
        border-top: 10px solid var(--theia-focusBorder);
        content: "";
        top: 0;
        position: absolute;
        right: 0;
        z-index: 1;
    }

    &:nth-child(16n + 2) {
        color: inherit;
    }
`;

export const StyledPianoRoll = styled.div`
    align-items: start;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    overflow: auto;
    margin: 2px var(--padding) var(--padding);
    position: relative;

    ${MetaLineTick}:nth-child(16n + 1) {
        border-right-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-right-color: rgba(0, 0, 0, .4);
        }
    }
`;
