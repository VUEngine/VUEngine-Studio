import { nls } from '@theia/core';
import React from 'react';
import { DataSection, FontEditorState, MAX_CHAR_COUNT, MIN_CHAR_COUNT, MIN_OFFSET } from '../FontEditorTypes';

interface AlphabetSettingsProps {
    charCount: number
    setCharCount: (charCount: number) => void
    offset: number
    setOffset: (offset: number) => void
    section: DataSection
    setSection: (section: DataSection) => void
    alphabetGrid: number
    setState: (state: Partial<FontEditorState>) => void
}

export default function AlphabetSettings(props: AlphabetSettingsProps): JSX.Element {

    const {
        charCount, setCharCount,
        offset, setOffset,
        // section, setSection,
        alphabetGrid,
        setState,
    } = props;

    return <div className='font-properties'>
        <div>
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
        </div>
        <div>
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
        </div>
        {/*
        <div>
            <label>
                {nls.localize('vuengine/fontEditor/section', 'Section')}
            </label>
            <SelectComponent
                defaultValue={section}
                options={[{
                    label: nls.localize('vuengine/fontEditor/romSpace', 'ROM Space'),
                    value: DataSection.ROM,
                    label: nls.localize('vuengine/fontEditor/romSpaceDescription', 'Save tile data to ROM space'),
                }, {
                    label: nls.localize('vuengine/fontEditor/expansionSpace', 'Expansion Space'),
                    value: DataSection.EXP,
                    label: nls.localize('vuengine/fontEditor/expansionSpaceDescription', 'Save tile data to expansion space'),
                }]}
                onChange={option => setSection(option.value as DataSection)}
            />
        </div>
        */}
        <div>
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
        </div>
    </div>;
}
