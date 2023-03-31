import { nls } from '@theia/core';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';

interface VesPaletteProps {
    value: string;
    label: string;
    updateValue: (newValue: string) => void;
}

const paletteValues: SelectOption[] = [
    { value: '11', label: '11', description: nls.localize('vuengine/editors/palette/brightRed', 'Bright Red') },
    { value: '10', label: '10', description: nls.localize('vuengine/editors/palette/mediumRed', 'Medium Red') },
    { value: '01', label: '01', description: nls.localize('vuengine/editors/palette/darkRed', 'Dark Red') },
    { value: '00', label: '00', description: nls.localize('vuengine/editors/palette/black', 'Black') },
];

export const VesPalette: React.FC<VesPaletteProps> = ({ value, updateValue, label }) => {
    const index0 = value.substring(0, 2);
    const index1 = value.substring(2, 4);
    const index2 = value.substring(4, 6);

    const getUpdatedValue = (index: number, newValue: string) =>
        value.substring(0, index * 2) + newValue + value.substring(index * 2 + 2);

    // const jsonforms = useJsonForms();
    // const dataObject = jsonforms.core?.data;
    // const schema = jsonforms.core?.schema;
    // const uiSchema = jsonforms.core?.uischema;

    return (
        <div className='control palette-renderer'>
            <label>{label}</label>
            <div className='input'>
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
            </div>
        </div>
    );
};
