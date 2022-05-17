
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesPalette } from './ves-palette';

interface VesPaletteControlProps {
    data: string;
    handleChange(path: string, value: string): void;
    path: string;
}

const VesPaletteControl = ({ data, handleChange, path }: VesPaletteControlProps) => (
    <VesPalette
        value={data}
        updateValue={(newValue: string) => handleChange(path, newValue)}
    />
);

export default withJsonFormsControlProps(VesPaletteControl);
