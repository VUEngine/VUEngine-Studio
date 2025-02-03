import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import RomInfoEditor from '../../components/RomInfoEditor/RomInfoEditor';
import { RomInfoData } from '../../components/RomInfoEditor/RomInfoEditorTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesRomInfoEditorControlProps {
    data: RomInfoData;
    handleChange(path: string, value: RomInfoData): void;
    path: string;
}

const VesRomInfoEditorControl = ({ data, handleChange, path }: VesRomInfoEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <RomInfoEditor
            data={data}
            updateData={(newValue: RomInfoData) => {
                if (!context.isReadonly) {
                    handleChange(path, newValue);
                }
            }}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesRomInfoEditorControl);
