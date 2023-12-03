import { nls } from '@theia/core';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import HContainer from './HContainer';

interface PaletteProps {
    value: string;
    updateValue: (newValue: string) => void;
}

const paletteValues: SelectOption[] = [
    { value: '11', label: '11', description: nls.localize('vuengine/editors/palette/brightRed', 'Bright Red') },
    { value: '10', label: '10', description: nls.localize('vuengine/editors/palette/mediumRed', 'Medium Red') },
    { value: '01', label: '01', description: nls.localize('vuengine/editors/palette/darkRed', 'Dark Red') },
    { value: '00', label: '00', description: nls.localize('vuengine/editors/palette/black', 'Black') },
];

export default function Palette(props: PaletteProps): React.JSX.Element {
    const { value, updateValue } = props;

    const index0 = value.substring(0, 2);
    const index1 = value.substring(2, 4);
    const index2 = value.substring(4, 6);

    const getUpdatedValue = (index: number, newValue: string) =>
        value.substring(0, index * 2) + newValue + value.substring(index * 2 + 2);

    return <>
        <HContainer className='palette-renderer' gap={2}>
            <div className={`value-${index0}`}>
                <SelectComponent
                    key="paletteIndex0"
                    options={paletteValues}
                    defaultValue={index0}
                    onChange={option => updateValue(getUpdatedValue(0, option.value!))} />
            </div>
            <div className={`value-${index1}`}>
                <SelectComponent
                    key="paletteIndex1"
                    options={paletteValues}
                    defaultValue={index1}
                    onChange={option => updateValue(getUpdatedValue(1, option.value!))} />
            </div>
            <div className={`value-${index2}`}>
                <SelectComponent
                    key="paletteIndex2"
                    options={paletteValues}
                    defaultValue={index2}
                    onChange={option => updateValue(getUpdatedValue(2, option.value!))} />
            </div>
            <div className="value-00">
                <div className="theia-select-component">
                    <div className="theia-select-component-label">00</div>
                </div>
            </div>
        </HContainer>
    </>;
}
