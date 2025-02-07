import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import {
    Diagnostics,
    DIAGNOSTICS_LABELS,
    ENABLE_PROFILER_DEFAULT_VALUE,
    EngineConfigData,
    STACK_HEADROOM_DEFAULT_VALUE,
    STACK_HEADROOM_MAX_VALUE,
    STACK_HEADROOM_MIN_VALUE,
} from '../EngineConfigEditorTypes';

interface EngineConfigDebugProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigDebug(props: EngineConfigDebugProps): React.JSX.Element {
    const { data, updateData } = props;

    const setDiagnostics = (diagnostics: Diagnostics): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                diagnostics,
            }
        });
    };

    const toggleEnableProfiler = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                enableProfiler: !(data.debug?.enableProfiler ?? ENABLE_PROFILER_DEFAULT_VALUE),
                diagnostics: Diagnostics.NONE,
            }
        });
    };

    const setStackHeadroom = (stackHeadroom: number): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                stackHeadroom,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/engineConfig/debug/profiler', 'Profiler')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.enableProfiler ?? ENABLE_PROFILER_DEFAULT_VALUE}
                        onChange={() => toggleEnableProfiler()}
                    />
                    {nls.localizeByDefault('Enable')}
                </label>
            </VContainer>
            {!data.debug?.enableProfiler &&
                <VContainer grow={1}>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/engineConfig/debug/showDiagnostics', 'Show Diagnostics')}
                    />
                    <div style={{ width: 200 }}>
                        <SelectComponent
                            options={Object.values(Diagnostics).map(d => ({
                                value: d,
                                label: DIAGNOSTICS_LABELS[d] ?? d,
                            }))}
                            defaultValue={data.debug?.diagnostics ?? Diagnostics.NONE}
                            onChange={option => setDiagnostics(option.value as Diagnostics)}
                        />
                    </div>
                </VContainer>
            }
            <Input
                label={nls.localize('vuengine/editors/engineConfig/debug/stackHeadroom', 'Stack Headroom')}
                type="number"
                value={data.debug?.stackHeadroom ?? STACK_HEADROOM_DEFAULT_VALUE}
                setValue={setStackHeadroom}
                min={STACK_HEADROOM_MIN_VALUE}
                max={STACK_HEADROOM_MAX_VALUE}
                defaultValue={STACK_HEADROOM_DEFAULT_VALUE}
                width={64}
            />
        </VContainer>
    );
}
