import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';

interface VesPaletteProps {
    id?: string;
    value: string;
    updateValue: (newValue: string) => void;
}

const paletteValues: SelectOption[] = [
    { value: '11', label: '11', description: 'Bright Red' },
    { value: '10', label: '10', description: 'Medium Red' },
    { value: '01', label: '01', description: 'Dark Red' },
    { value: '00', label: '00', description: 'Black' },
];

export const VesPalette: React.FC<VesPaletteProps> = ({ id, value, updateValue }) => {
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
        <div className='palette-renderer'>
            <span className={`value-${index0}`}>
                <SelectComponent
                    key="paletteIndex0"
                    options={paletteValues}
                    value={index0}
                    onChange={option => updateValue(getUpdatedValue(0, option.value!))} />
            </span>
            <span className={`value-${index1}`}>
                <SelectComponent
                    key="paletteIndex1"
                    options={paletteValues}
                    value={index1}
                    onChange={option => updateValue(getUpdatedValue(1, option.value!))} />
            </span>
            <span className={`value-${index2}`}>
                <SelectComponent
                    key="paletteIndex2"
                    options={paletteValues}
                    value={index2}
                    onChange={option => updateValue(getUpdatedValue(2, option.value!))} />
            </span>
            <span className="value-00">
                <div className="theia-select-component">
                    <div className="theia-select-component-label">00</div>
                </div>
            </span>
        </div >
    );
};
