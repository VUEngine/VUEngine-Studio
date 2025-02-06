import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import {
    EngineConfigData,
    TOTAL_SRAM_DEFAULT_VALUE,
    TOTAL_SRAM_MAX_VALUE,
    TOTAL_SRAM_MIN_VALUE
} from '../EngineConfigEditorTypes';
import { clamp } from '../../Common/Utils';
import InfoLabel from '../../Common/InfoLabel';
import { nls } from '@theia/core';

interface EngineConfigSramProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigSram(props: EngineConfigSramProps): React.JSX.Element {
    const { data, updateData } = props;

    const setTotalSram = (totalSram: number): void => {
        updateData({
            ...data,
            sram: {
                ...(data.sram ?? {}),
                totalSram: clamp(
                    totalSram,
                    TOTAL_SRAM_MIN_VALUE,
                    TOTAL_SRAM_MAX_VALUE,
                    TOTAL_SRAM_DEFAULT_VALUE
                ),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/sram/totalSram', 'Total SRAM')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/sram/totalSramDescription',
                        'The amount of available SRAM space, in bytes. The Virtual Boy allows up to 16 MB, but most cartridges support only 8 kb (8192 b) of SRAM.',
                    )}
                />
                <input
                    className="theia-input"
                    style={{ width: 64 }}
                    type="number"
                    value={data.sram?.totalSram ?? TOTAL_SRAM_DEFAULT_VALUE}
                    min={TOTAL_SRAM_MIN_VALUE}
                    max={TOTAL_SRAM_MAX_VALUE}
                    onChange={e => setTotalSram(e.target.value === '' ? TOTAL_SRAM_MIN_VALUE : parseInt(e.target.value))}
                />
            </VContainer>
        </VContainer>
    );
}
