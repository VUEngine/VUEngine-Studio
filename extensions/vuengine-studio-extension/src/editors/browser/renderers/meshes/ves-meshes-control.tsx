
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesMeshes } from './ves-meshes';

interface VesMeshesControlProps {
    data: string;
    handleChange(path: string, value: string): void;
    path: string;
}

const VesMeshesControl = ({ data, handleChange, path }: VesMeshesControlProps) => (
    <VesMeshes
        value={data}
        updateValue={(newValue: string) => handleChange(path, newValue)}
    />
);

export default withJsonFormsControlProps(VesMeshesControl);
