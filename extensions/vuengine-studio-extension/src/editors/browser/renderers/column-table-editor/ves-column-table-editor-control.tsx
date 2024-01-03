import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import ColumnTableEditor from '../../components/ColumnTableEditor/ColumnTableEditor';
import { ColumnTableData } from '../../components/ColumnTableEditor/ColumnTableTypes';
import { EditorsContext } from '../../ves-editors-types';

interface VesColumnTableEditorControlProps {
    data: ColumnTableData;
    handleChange(path: string, value: ColumnTableData): void;
    path: string;
}

const VesColumnTableEditorControl = ({ data, handleChange, path }: VesColumnTableEditorControlProps) =>
    <EditorsContext.Consumer>
        {context => <ColumnTableEditor
            data={data}
            updateData={(newValue: ColumnTableData) => handleChange(path, newValue)}
        />}
    </EditorsContext.Consumer>;

export default withJsonFormsControlProps(VesColumnTableEditorControl);
