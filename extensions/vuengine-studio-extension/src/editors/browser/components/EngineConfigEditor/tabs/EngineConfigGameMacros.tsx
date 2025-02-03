import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { EngineConfigData } from '../EngineConfigEditorTypes';
import MacrosList from '../../Common/MacrosList';

interface EngineConfigGameMacrosProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigGameMacros(props: EngineConfigGameMacrosProps): React.JSX.Element {
    const { data, updateData } = props;

    return (
        <VContainer gap={15}>
            <MacrosList
                data={data.game}
                updateData={macros => updateData({
                    ...data,
                    game: macros,
                })}
            />
        </VContainer>
    );
}
