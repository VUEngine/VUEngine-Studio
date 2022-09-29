import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import { DataSection, MAX_CHAR_COUNT, MIN_CHAR_COUNT, MIN_OFFSET } from '../types';

interface AlphabetSettingsProps {
    charCount: number
    setCharCount: (charCount: number) => void
    offset: number
    setOffset: (offset: number) => void
    section: DataSection
    setSection: (section: DataSection) => void
}

export default function AlphabetSettings(props: AlphabetSettingsProps): JSX.Element {
    const {
        charCount, setCharCount,
        offset, setOffset,
        section, setSection,
    } = props;

    return <div className='font-properties'>
        <div>
            <label>Count</label>
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
            <label>Offset</label>
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
        <div>
            <label>Section</label>
            <SelectComponent
                defaultValue={section}
                options={[{
                    label: 'ROM Space',
                    value: DataSection.ROM,
                    description: 'Save tile data in regular ROM space',
                }, {
                    label: 'Expansion Space',
                    value: DataSection.EXP,
                    description: 'Save tile data to expansion space',
                }]}
                onChange={option => setSection(option.value as DataSection)}
            />
        </div>
    </div>;
}
