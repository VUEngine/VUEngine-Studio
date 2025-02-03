import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { EngineConfigData } from '../EngineConfigEditorTypes';
import MacrosList from '../../Common/MacrosList';

interface EngineConfigMacrosProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigMacros(props: EngineConfigMacrosProps): React.JSX.Element {
    const { data, updateData } = props;

    return (
        <VContainer gap={15}>
            <MacrosList
                data={data.macros}
                updateData={macros => updateData({
                    ...data,
                    macros,
                })}
            />
        </VContainer>
    );
}
