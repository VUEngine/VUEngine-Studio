import { withJsonFormsControlProps } from '@jsonforms/react';
import React from 'react';
import ColumnTableEditor from '../../components/ColumnTableEditor/ColumnTableEditor';
import { ColumnTableData } from '../../components/ColumnTableEditor/ColumnTableTypes';

interface VesColumnTableEditorControlProps {
    data: ColumnTableData;
    handleChange(path: string, value: ColumnTableData): void;
    path: string;
}

const VesColumnTableEditorControl = ({ data, handleChange, path }: VesColumnTableEditorControlProps) =>
    <ColumnTableEditor
        data={data}
        updateData={(newValue: ColumnTableData) => handleChange(path, newValue)}
    />;

export default withJsonFormsControlProps(VesColumnTableEditorControl);
