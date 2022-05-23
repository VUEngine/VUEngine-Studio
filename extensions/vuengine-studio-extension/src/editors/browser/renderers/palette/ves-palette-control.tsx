
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesPalette } from './ves-palette';

interface VesPaletteControlProps {
    data: string;
    handleChange(path: string, value: string): void;
    path: string;
    label: string;
}

const VesPaletteControl = ({ data, handleChange, path, label }: VesPaletteControlProps) => (
    <VesPalette
        label={label}
        value={data}
        updateValue={(newValue: string) => handleChange(path, newValue)}
    />
);

export default withJsonFormsControlProps(VesPaletteControl);
