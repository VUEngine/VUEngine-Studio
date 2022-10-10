import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import RumbleEffectEditor from '../../components/RumbleEffectEditor/RumbleEffectEditor';
import { RumbleEffectData } from '../../components/RumbleEffectEditor/RumbleEffectTypes';

interface VesRumbleEffectEditorControlProps {
    data: RumbleEffectData;
    handleChange(path: string, value: RumbleEffectData): void;
    path: string;
    config?: any;
}

const VesRumbleEffectEditorControl = ({ data, handleChange, path, config }: VesRumbleEffectEditorControlProps) =>
    <RumbleEffectEditor
        data={data}
        updateData={(newValue: RumbleEffectData) => handleChange(path, newValue)}
        services={config.services}
    />;

export default withJsonFormsControlProps(VesRumbleEffectEditorControl);
