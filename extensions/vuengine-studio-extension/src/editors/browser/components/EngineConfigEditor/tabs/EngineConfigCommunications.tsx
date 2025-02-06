import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { COMMUNICATIONS_ENABLE_DEFAULT_VALUE, EngineConfigData } from '../EngineConfigEditorTypes';

interface EngineConfigCommunicationsProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigCommunications(props: EngineConfigCommunicationsProps): React.JSX.Element {
    const { data, updateData } = props;

    const toggleEnabled = (): void => {
        updateData({
            ...data,
            communications: {
                ...(data.communications ?? {}),
                enable: !(data.communications?.enable ?? COMMUNICATIONS_ENABLE_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/communications/enabled', 'Enabled')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/communications/enabledDescription',
                        'Enable communications at the start of the game, e.g. for link play.',
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.communications?.enable ?? COMMUNICATIONS_ENABLE_DEFAULT_VALUE}
                    onChange={() => toggleEnabled()}
                />
            </VContainer>
        </VContainer>
    );
}
