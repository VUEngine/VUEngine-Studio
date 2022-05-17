
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesRating } from './ves-rating';

interface VesRatingControlProps {
    data: number;
    handleChange(path: string, value: number): void;
    path: string;
}

const VesRatingControl = ({ data, handleChange, path }: VesRatingControlProps) => (
    <VesRating
        value={data}
        updateValue={(newValue: number) => handleChange(path, newValue)}
    />
);

export default withJsonFormsControlProps(VesRatingControl);
