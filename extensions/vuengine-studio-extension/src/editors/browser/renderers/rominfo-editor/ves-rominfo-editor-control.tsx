import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import RomInfoEditor from '../../components/RomInfoEditor/RomInfoEditor';
import { RomInfoEditorData } from '../../components/RomInfoEditor/RomInfoEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesRomInfoEditorControlProps {
    data: RomInfoEditorData;
    handleChange(path: string, value: RomInfoEditorData): void;
    path: string;
}

const VesRomInfoEditorControl = ({ data, handleChange, path }: VesRomInfoEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <RomInfoEditor
            data={data}
            updateData={(newValue: RomInfoEditorData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesRomInfoEditorControl);
