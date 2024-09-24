import styled from 'styled-components';
import { PIANO_ROLL_NOTE_HEIGHT, PIANO_ROLL_NOTE_WIDTH } from '../MusicEditorTypes';

// these need to be in a single fine for references to each other to work

export const StyledPianoRoll = styled.div`
    align-items: start;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    overflow: auto;
    margin: 0 var(--padding) var(--padding);
    position: relative;
`;

export const StyledPianoRollEditor = styled.div`
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    padding: 1px 0;
`;

export const StyledPianoRollRow = styled.div`
    min-height: ${PIANO_ROLL_NOTE_HEIGHT + 1}px;
    display: flex;

    &.cNote {
        min-height: ${PIANO_ROLL_NOTE_HEIGHT + 2}px;
    }
    &.last {
        min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    }
`;

export const StyledPianoRollNote = styled.div`
    background-color: var(--theia-secondaryButton-background);
    cursor: crosshair;
    flex-grow: 1;
    margin-bottom: 1px;
    margin-right: 1px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT}px;
    min-width: ${PIANO_ROLL_NOTE_WIDTH}px;
    max-width: ${PIANO_ROLL_NOTE_WIDTH}px;

    &.current {
        background-color: var(--theia-secondaryButton-hoverBackground) !important;
    }
    &.otherChannelSet {
        background-color: var(--theia-editor-foreground) !important;
    }
    &.set {
        background-color: var(--theia-focusBorder) !important;
    }

    &:hover {
        outline: 1px solid var(--theia-focusBorder);
        outline-offset: 1px;
        z-index: 10;
    }
    &:nth-child(4n + 1) {
        margin-right: 2px;
    }
    &.noteResolution4:nth-child(4n + 1) {
        margin-right: 3px;
    }
    &.noteResolution8:nth-child(8n + 1) {
        margin-right: 3px;
    }
    &.noteResolution16:nth-child(16n + 1) {
        margin-right: 3px;
    }
    &.noteResolution32:nth-child(32n + 1) {
        margin-right: 3px;
    }

    ${StyledPianoRollRow}:hover & {
        background-color: var(--theia-secondaryButton-hoverBackground);
    }

    ${StyledPianoRollRow}.cNote & {
        margin-bottom: 2px;
    }

    ${StyledPianoRollRow}.cNote:last-child & {
        margin-bottom: 0;
    }
`;

export const StyledPianoRollKey = styled.div`
    align-items: center;
    background-color: #f1f1f1;
    border-bottom: 0px solid #ccc;
    box-sizing: border-box;
    color: #666;
    cursor: pointer;
    display: flex;
    font-size: 9px;
    left: 0;
    line-height: 6px;
    margin-right: 3px;
    min-height: ${PIANO_ROLL_NOTE_HEIGHT - 1}px;
    max-height: ${PIANO_ROLL_NOTE_HEIGHT + 2}px;
    min-width: 50px;
    padding-left: 3px;
    position: sticky;
    width: 50px;

    &.sharpNote {
        background-color: #eee !important;
        color: #ccc;

        &:after {
            background: #111;
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

    ${StyledPianoRollRow}.cNote & {
        border-bottom-width: 2px;
    }

    ${StyledPianoRollRow}.cNote:last-child & {
        border-bottom-width: 1px;
    }
`;

export const StyledPianoRollKeyName = styled.div`
    display: none;
    z-index: 1;

    ${StyledPianoRollRow}.cNote &,
    ${StyledPianoRollRow}:hover & {
        display: block;
    }
`;

export const MetaLine = styled.div`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    padding: 1px 0;
    position: sticky;
    z-index: 100;
    background: var(--theia-editor-background);
`;

export const MetaLineHeader = styled.div`
    background: var(--theia-editor-background);
    display: flex;
    flex-direction: column;
    height: 28px;
    left: 0;
    margin-right: 3px;
    min-width: 50px;
    position: sticky;
    width: 50px;
    z-index: 10;
`;

export const MetaLineHeaderLine = styled.div`
    align-items: center;
    display: flex;
    flex-grow: 1;
    min-height: 13px;
    opacity: .3;
`;

export const MetaLineNote = styled.div`
    align-items: center;
    cursor: ew-resize;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 1px;
    margin-bottom: 1px;
    margin-right: 1px;
    min-width: 15px;
    max-width: 15px;
    position: relative;

    &:hover {
        outline: 1px solid var(--theia-focusBorder);
    }
    &:nth-child(4n + 1) {
        margin-right: 2px;
    }
    &.noteResolution4:nth-child(4n + 1) {
        margin-right: 3px;
    }
    &.noteResolution8:nth-child(8n + 1) {
        margin-right: 3px;
    }
    &.noteResolution16:nth-child(16n + 1) {
        margin-right: 3px;
    }
    &.noteResolution32:nth-child(32n + 1) {
        margin-right: 3px;
    }
`;

export const MetaLineNoteEffects = styled.div`
    align-items: center;
    display: flex;
    font-size: 8px;
    flex-grow: 1;
    justify-content: center;
    overflow: hidden;
    width: 100%;
`;

export const MetaLineNoteVolume = styled.div`
    align-items: end;
    background-color: var(--theia-secondaryButton-background);
    display: flex;
    height: 16px;
    width: 100%;
`;

export const MetaLineNoteVolumeChannel = styled.div`
    background-color: var(--theia-editor-foreground);
    flex-grow: 1;
    opacity: .4;
`;

export const StyledPianoRollHeaderNote = styled(MetaLineNote)`
    margin-right: 0px !important;
    padding-right: 1px;

    &.rangeStart, &.rangeEnd, &.inRange {
        border-top: 1px solid var(--theia-focusBorder);
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

    &:nth-child(4n + 1) {
        padding-right: 2px;
    }
    &.noteResolution4:nth-child(4n + 1) {
        margin-right: 3px;
    }
    &.noteResolution8:nth-child(8n + 1) {
        margin-right: 3px;
    }
    &.noteResolution16:nth-child(16n + 1) {
        margin-right: 3px;
    }
    &.noteResolution32:nth-child(32n + 1) {
        margin-right: 3px;
    }
`;
