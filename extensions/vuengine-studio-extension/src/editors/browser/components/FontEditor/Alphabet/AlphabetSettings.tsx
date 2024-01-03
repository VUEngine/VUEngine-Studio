import { nls } from '@theia/core';
import React from 'react';
import { FontEditorState, MAX_CHAR_COUNT, MIN_CHAR_COUNT, MIN_OFFSET } from '../FontEditorTypes';
import VContainer from '../../Common/VContainer';
import HContainer from '../../Common/HContainer';
import RadioSelect from '../../Common/RadioSelect';

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

    return <HContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/fontEditor/count', 'Count')}
            </label>
            <input
                type="number"
                className="theia-input"
                style={{ width: 48 }}
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
                type="number"
                className="theia-input"
                style={{ width: 48 }}
                step="1"
                min={MIN_OFFSET}
                max={MAX_CHAR_COUNT - charCount}
                value={offset}
                onChange={e => setOffset(parseInt(e.target.value))}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/fontEditor/grid', 'Grid')}
            </label>
            <RadioSelect
                options={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }]}
                defaultValue={alphabetGrid}
                onChange={options => setState({ alphabetGrid: options[0].value as number })}
            />
        </VContainer>
    </HContainer>;
}
