
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesFontData } from './ves-fontData';

interface VesFontDataControlProps {
    data: FontData;
    handleChange(path: string, value: FontData): void;
    path: string;
    label: string;
}

export interface FontData {
    offset: number
    characterCount: number
    size: {
        x: number,
        y: number
    }
    characters: string[]
}

const VesFontDataControl = ({ data, handleChange, path, label }: VesFontDataControlProps) => (
    <VesFontData
        label={label}
        value={data}
        updateValue={(newValue: FontData) => handleChange(path, newValue)}
    />
);

export default withJsonFormsControlProps(VesFontDataControl);
