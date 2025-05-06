import styled from 'styled-components';
import { MAX_PATTERN_SIZE, NOTE_RESOLUTION, PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../SoundEditorTypes';

// these need to be in a single fine for references to each other to work

export const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    user-select: none;
`;

export const StyledPianoRollRow = styled.div`
    display: flex;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    position: relative;
    z-index: 10;
`;

export const StyledPianoRollEditorTick = styled.div`
    border-bottom: 1px solid rgba(255, 255, 255, .1);
    border-right: 1px solid rgba(255, 255, 255, .1);
    box-sizing: border-box;
    cursor: crosshair;
    flex-grow: 1;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    max-width: ${PIANO_ROLL_NOTE_WIDTH}px;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .1);
        border-right-color: rgba(0, 0, 0, .1);
    }

    &:hover {
        background-color: var(--theia-focusBorder) !important;
        z-index: 100;
    }
    &:nth-child(4n + 1) {
        border-right-color: rgba(255, 255, 255, .2);

        body.theia-light &,
        body.theia-hc & {
            border-right-color: rgba(0, 0, 0, .2);
        }
    }

    ${StyledPianoRollRow}:nth-child(12n) & {
        border-bottom-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-bottom-color: rgba(0, 0, 0, .4);
        }
    }
    ${StyledPianoRollRow}:nth-child(84) & {
        border-bottom-color: transparent;

        body.theia-light &,
        body.theia-hc & {
            border-bottom-color: transparent;
        }
    }

    ${StyledPianoRollRow}:hover & {
        background-color: rgba(255, 255, 255, .1);

        body.theia-light &,
        body.theia-hc & {
            background-color: rgba(0, 0, 0, .1);
        }
    }
`;

export const StyledPianoRollKey = styled.div`
    align-items: center;
    background-color: #f1f1f1;
    border-bottom: 0px solid rgba(0, 0, 0, .5);
    box-sizing: border-box;
    color: #666;
    cursor: pointer;
    display: flex;
    font-size: 9px;
    left: 0;
    line-height: 6px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: 50px;
    padding-left: 3px;
    position: sticky;
    width: 50px;
    z-index: 100;

    &.sharpNote {
        background-color: #eee !important;
        color: rgba(0, 0, 0, .5);

        &:after {
            background: #111;
            border-top-right-radius: 2px;
            border-bottom-right-radius: 2px;
            content: "";
            height: 100%;
            position: absolute;
            left: 0;
            width: 75%;
        }
    }

    ${StyledPianoRollRow}:hover &,
    &:hover,
    &.sharpNote:hover:after,
    ${StyledPianoRollRow}:hover &.sharpNote:after {
        background: var(--theia-button-background);
        color: var(--theia-button-foreground)
    }

    ${StyledPianoRollRow}:nth-child(12n) & {
        border-bottom-width: 1px;
    }

    ${StyledPianoRollRow}:nth-child(84) & {
        border-bottom-width: 0;
    }

    body.theia-light & {
        border-right: 1px solid rgba(0, 0, 0, .4);
    }

    body.theia-light ${StyledPianoRollRow}:first-child & {
        border-top: 1px solid rgba(0, 0, 0, .4);
    }
`;

export const StyledPianoRollKeyName = styled.div`
    display: none;
    z-index: 1;

    ${StyledPianoRollRow}:nth-child(12n) &,
    ${StyledPianoRollRow}:hover & {
        display: block;
    }
`;

export const StyledPianoRollPlacedNote = styled.div`
    background-color: rgba(0, 0, 0, .75);
    border-radius: 1px;
    box-sizing: border-box;
    color: #fff;
    cursor: pointer;
    font-size: ${PIANO_ROLL_NOTE_HEIGHT - 2}px;
    line-height: ${PIANO_ROLL_NOTE_HEIGHT - 2}px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    outline-offset: 1px;
    overflow: hidden;
    padding-left: 1px;
    position: absolute;
    text-overflow: ellipsis;
    z-index: 10;

    &.oc {
        border-radius: 0;
        outline-width: 0;
        z-index: 0;
    }

    &.selected {
        outline: 3px solid var(--theia-focusBorder);
    }

    .react-resizable-handle-e {
        border-left: 1px solid;
        bottom: 2px;
        cursor: col-resize;
        position: absolute;
        right: 0;
        top: 2px;
        width: 2px;
    }
`;

export const MetaLine = styled.div`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    left: 0;
    min-height: 19px;
    position: sticky;
    background: var(--theia-editor-background);
    z-index: 200;
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .4);
    border-right: 1px solid rgba(255, 255, 255, .4);
    border-top: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 28px;
    left: 0;
    min-width: 50px;
    position: sticky;
    width: 50px;
    z-index: 10;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .1);
        border-right-color: rgba(0, 0, 0, .1);
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

export const MetaLineHeaderLine = styled.div`
    align-items: center;
    display: flex;
    flex-grow: 1;
    justify-content: center;
    min-height: 13px;
    opacity: .75;
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
    min-height: 28px;
    max-height: 28px;
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

    ${MetaLineTick}:nth-child(16n + 1),
    ${StyledPianoRollEditorTick}:nth-child(16n + 1) {
        border-right-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-right-color: rgba(0, 0, 0, .4);
        }
    }
    
    ${[...Array(MAX_PATTERN_SIZE * NOTE_RESOLUTION)].map((i, j) => `
        &.currentTick-${j} ${StyledPianoRollEditorTick}:nth-child(${j + 2})${j < (MAX_PATTERN_SIZE * NOTE_RESOLUTION - 1) ? ',' : ''}
    `)} {
        background-color: rgba(255, 255, 255, .1);

        body.theia-light & {
            background: rgba(0, 0, 0, .1);
        }
    }

    ${[...Array(MAX_PATTERN_SIZE)].map((i, j) => `&.size-${j + 1}  { 
        ${MetaLineTick}:nth-child(${(j + 1) * NOTE_RESOLUTION + 1}) ~ ${MetaLineTick},
        ${StyledPianoRollEditorTick}:nth-child(${(j + 1) * NOTE_RESOLUTION + 1}) ~ ${StyledPianoRollEditorTick} { 
            display: none;
        } 
    }`)}
`;
