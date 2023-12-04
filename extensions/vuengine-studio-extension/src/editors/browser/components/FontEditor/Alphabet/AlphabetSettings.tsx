import { nls } from '@theia/core';
import React from 'react';
import { FontEditorState, MAX_CHAR_COUNT, MIN_CHAR_COUNT, MIN_OFFSET } from '../FontEditorTypes';
import VContainer from '../../Common/VContainer';
import HContainer from '../../Common/HContainer';

interface AlphabetSettingsProps {
    charCount: number
    setCharCount: (charCount: number) => void
    offset: number
    setOffset: (offset: number) => void
    alphabetGrid: number
    setState: (state: Partial<FontEditorState>) => void
}

export default function AlphabetSettings(props: AlphabetSettingsProps): React.JSX.Element {

    const {
        charCount, setCharCount,
        offset, setOffset,
        alphabetGrid,
        setState,
    } = props;

    return <HContainer gap={20}>
        <VContainer grow={1}>
            <label>
                {nls.localize('vuengine/fontEditor/count', 'Count')}
            </label>
            <input
                className="theia-input"
                type="number"
                step="1"
                min={MIN_CHAR_COUNT}
                max={MAX_CHAR_COUNT - offset}
                value={charCount}
                onChange={e => setCharCount(parseInt(e.target.value))}
            />
        </VContainer>
        <VContainer grow={1}>
            <label>
                {nls.localize('vuengine/fontEditor/offset', 'Offset')}
            </label>
            <input
                className="theia-input"
                type="number"
                step="1"
                min={MIN_OFFSET}
                max={MAX_CHAR_COUNT - charCount}
                value={offset}
                onChange={e => setOffset(parseInt(e.target.value))}
            />
        </VContainer>
        <VContainer grow={1}>
            <label>
                {nls.localize('vuengine/fontEditor/grid', 'Grid')}
            </label>
            <input
                className="theia-input"
                type="number"
                step="1"
                min="0"
                max="3"
                value={alphabetGrid}
                onChange={e => setState({ alphabetGrid: parseInt(e.target.value) })}
            />
        </VContainer>
    </HContainer>;
}
