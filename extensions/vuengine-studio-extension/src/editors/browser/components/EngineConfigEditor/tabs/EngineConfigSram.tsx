import { nls } from '@theia/core';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import {
    EngineConfigData,
    TOTAL_SRAM_DEFAULT_VALUE,
    TOTAL_SRAM_MAX_VALUE,
    TOTAL_SRAM_MIN_VALUE
} from '../EngineConfigEditorTypes';

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
                totalSram,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <Input
                    label={nls.localize('vuengine/editors/engineConfig/sram/totalSram', 'Total SRAM')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/sram/totalSramDescription',
                        'The amount of available SRAM space, in bytes. The Virtual Boy allows up to 16 MB, but most cartridges support only 8 kb (8192 b) of SRAM.',
                    )}
                    type="number"
                    value={data.sram?.totalSram ?? TOTAL_SRAM_DEFAULT_VALUE}
                    setValue={setTotalSram}
                    min={TOTAL_SRAM_MIN_VALUE}
                    max={TOTAL_SRAM_MAX_VALUE}
                    defaultValue={TOTAL_SRAM_DEFAULT_VALUE}
                    width={64}
                />
            </VContainer>
        </VContainer>
    );
}
