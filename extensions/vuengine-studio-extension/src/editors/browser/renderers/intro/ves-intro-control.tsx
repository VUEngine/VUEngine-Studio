
import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import { VesIntro } from './ves-intro';

interface VesIntroControlProps {
    label: string;
}

const VesIntroControl = ({ label }: VesIntroControlProps) => (
    <VesIntro
        label={label}
    />
);

export default withJsonFormsControlProps(VesIntroControl);
