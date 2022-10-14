import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import TranslationsEditor from '../../components/TranslationsEditor/TranslationsEditor';
import { TranslationsData } from '../../components/TranslationsEditor/TranslationsEditorTypes';

interface VesTranslationsEditorControlProps {
    data: TranslationsData;
    handleChange(path: string, value: TranslationsData): void;
    path: string;
    config?: any;
}

const VesTranslationsEditorControl = ({ data, handleChange, path, config }: VesTranslationsEditorControlProps) =>
    <TranslationsEditor
        data={data}
        updateData={(newValue: TranslationsData) => handleChange(path, newValue)}
        projectData={config.projectData}
    />;

export default withJsonFormsControlProps(VesTranslationsEditorControl);
