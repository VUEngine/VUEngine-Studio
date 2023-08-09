
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import Palette from '../../components/Common/Palette';
import VContainer from '../../components/Common/VContainer';

interface VesPaletteControlProps {
    data: string;
    handleChange(path: string, value: string): void;
    path: string;
    label: string;
}

const VesPaletteControl = ({ data, handleChange, path, label }: VesPaletteControlProps) => (
    <VContainer>
        <label>{label}</label>
        <Palette
            value={data}
            updateValue={(newValue: string) => handleChange(path, newValue)}
        />
    </VContainer>
);

export default withJsonFormsControlProps(VesPaletteControl);
