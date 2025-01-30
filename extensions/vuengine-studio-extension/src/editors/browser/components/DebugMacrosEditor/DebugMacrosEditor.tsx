import React from 'react';
import MacrosList, { MacroData } from '../Common/MacrosList';
import { DebugMacrosData } from './DebugMacrosEditorTypes';

interface DebugMacrosEditorProps {
    data: DebugMacrosData
    updateData: (data: DebugMacrosData) => void
}

export default function DebugMacrosEditor(props: DebugMacrosEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    const setMacros = (macros: MacroData[]): void => {
        updateData({
            ...data,
            macros,
        });
    };

    return (
        <MacrosList
            data={data.macros}
            updateData={setMacros}
        />
    );
}
