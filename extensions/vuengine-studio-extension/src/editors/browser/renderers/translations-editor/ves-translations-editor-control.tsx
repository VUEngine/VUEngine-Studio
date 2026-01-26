import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import TranslationsEditor from '../../components/TranslationsEditor/TranslationsEditor';
import { TranslationsData } from '../../components/TranslationsEditor/TranslationsEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesTranslationsEditorControlProps {
    data: TranslationsData;
    handleChange(path: string, value: TranslationsData): void;
    path: string;
}

const VesTranslationsEditorControl = ({ data, handleChange, path }: VesTranslationsEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <TranslationsEditor
            translationsData={data}
            updateTranslationsData={(newValue: TranslationsData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesTranslationsEditorControl);
