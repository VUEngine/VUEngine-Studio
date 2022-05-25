import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesImages } from './ves-images';

interface VesImagesControlProps {
    label: string;
}

const VesImagesControl = ({ label }: VesImagesControlProps) => (
    <VesImages
        label={label}
    />
);

export default withJsonFormsControlProps(VesImagesControl);
