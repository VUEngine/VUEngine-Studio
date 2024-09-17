import { nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';
import { SongData } from '../MusicEditorTypes';

export interface MetaLineNoteProps {
    nth: boolean
}

export const MetaLineNote = styled.div<MetaLineNoteProps>`
    align-items: center;
    cursor: ew-resize;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 1px;
    margin-bottom: 1px;
    margin-right: ${p => p.nth
        ? '3px'
        : '1px'
    };
    min-width: 17px;
    max-width: 17px;
    position: relative;

    &:hover {
        outline: 1px solid var(--theia-focusBorder);
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

interface NotePropertiesNoteProps {
    index: number
    effects: string[]
    volumeL: number
    volumeR: number
    songData: SongData
    setCurrentNote: (currentNote: number) => void
    setNote: (index: number, note: number | undefined) => void
}

export default function NotePropertiesNote(props: NotePropertiesNoteProps): React.JSX.Element {
    const { index, volumeL, volumeR, effects, songData, setCurrentNote, setNote } = props;

    const labelEffects = nls.localize('vuengine/musicEditor/effects', 'Effects');
    const leftLabel = nls.localize('vuengine/musicEditor/left', 'Left');
    const rightLabel = nls.localize('vuengine/musicEditor/right', 'Right');

    return <MetaLineNote
        nth={(index + 1) % songData.bar === 0}
        title={`${effects.length} ${labelEffects}, ${leftLabel}: ${volumeL}%/${rightLabel}: ${volumeR}%`}
        onClick={() => setCurrentNote(index)}
        onContextMenu={() => setNote(index, undefined)}
    >
        <MetaLineNoteEffects>
        </MetaLineNoteEffects>
        <MetaLineNoteVolume>
            <MetaLineNoteVolumeChannel style={{ height: `${volumeL}%` }} />
            <MetaLineNoteVolumeChannel style={{ height: `${volumeR}%` }} />
        </MetaLineNoteVolume>
    </MetaLineNote>;
}
