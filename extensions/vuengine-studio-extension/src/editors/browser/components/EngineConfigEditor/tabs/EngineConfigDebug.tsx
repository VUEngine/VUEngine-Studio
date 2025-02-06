import { nls } from '@theia/core';
import React from 'react';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';
import {
    ALERT_VIP_OVERTIME_DEFAULT_VALUE,
    DIMM_FOR_PROFILING_DEFAULT_VALUE,
    ENABLE_PROFILER_DEFAULT_VALUE,
    EngineConfigData,
    PRINT_FRAMERATE_DEFAULT_VALUE,
    PROFILE_STREAMING_DEFAULT_VALUE,
    SHOW_DETAILED_MEMORY_POOL_STATUS_DEFAULT_VALUE,
    SHOW_MEMORY_POOL_STATUS_DEFAULT_VALUE,
    SHOW_STACK_OVERFLOW_ALERT_DEFAULT_VALUE,
    SHOW_STREAMING_PROFILING_DEFAULT_VALUE,
    STACK_HEADROOM_DEFAULT_VALUE,
    STACK_HEADROOM_MAX_VALUE,
    STACK_HEADROOM_MIN_VALUE
} from '../EngineConfigEditorTypes';
import InfoLabel from '../../Common/InfoLabel';

interface EngineConfigDebugProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigDebug(props: EngineConfigDebugProps): React.JSX.Element {
    const { data, updateData } = props;

    const toggleAlertVipOvertime = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                alertVipOvertime: !(data.debug?.alertVipOvertime ?? ALERT_VIP_OVERTIME_DEFAULT_VALUE),
            }
        });
    };

    const toggleEnableProfiler = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                enableProfiler: !(data.debug?.enableProfiler ?? ENABLE_PROFILER_DEFAULT_VALUE),
            }
        });
    };

    const toggleDimmForProfiling = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                dimmForProfiling: !(data.debug?.dimmForProfiling ?? DIMM_FOR_PROFILING_DEFAULT_VALUE),
            }
        });
    };

    const toggleProfileStreaming = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                profileStreaming: !(data.debug?.profileStreaming ?? PROFILE_STREAMING_DEFAULT_VALUE),
            }
        });
    };

    const toggleShowStreamingProfiling = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                showStreamingProfiling: !(data.debug?.showStreamingProfiling ?? SHOW_STREAMING_PROFILING_DEFAULT_VALUE),
            }
        });
    };

    const togglePrintFramerate = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                printFramerate: !(data.debug?.printFramerate ?? PRINT_FRAMERATE_DEFAULT_VALUE),
            }
        });
    };

    const toggleShowMemoryPoolStatus = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                showMemoryPoolStatus: !(data.debug?.showMemoryPoolStatus ?? SHOW_MEMORY_POOL_STATUS_DEFAULT_VALUE),
            }
        });
    };

    const toggleShowDetailedMemoryPoolStatus = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                showDetailedMemoryPoolStatus: !(data.debug?.showDetailedMemoryPoolStatus ?? SHOW_DETAILED_MEMORY_POOL_STATUS_DEFAULT_VALUE),
            }
        });
    };

    const setStackHeadroom = (stackHeadroom: number): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                stackHeadroom: clamp(
                    stackHeadroom,
                    STACK_HEADROOM_MIN_VALUE,
                    STACK_HEADROOM_MAX_VALUE,
                    STACK_HEADROOM_DEFAULT_VALUE
                ),
            }
        });
    };

    const toggleShowStackOverflowAlert = (): void => {
        updateData({
            ...data,
            debug: {
                ...(data.debug ?? {}),
                showStackOverflowAlert: !(data.debug?.showStackOverflowAlert ?? SHOW_STACK_OVERFLOW_ALERT_DEFAULT_VALUE),
            }
        });
    };

    return (
        <VContainer gap={15}>
            <VContainer>
                <label>
                    VIP
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.alertVipOvertime ?? ALERT_VIP_OVERTIME_DEFAULT_VALUE}
                        onChange={() => toggleAlertVipOvertime()}
                    />
                    {nls.localize('vuengine/editors/engineConfig/debug/alertVipOvertime', 'Alert VIP Overtime')}
                </label>
            </VContainer>
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
                    {nls.localize('vuengine/editors/engineConfig/debug/enableProfiler', 'Enable Profiler')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.dimmForProfiling ?? DIMM_FOR_PROFILING_DEFAULT_VALUE}
                        onChange={() => toggleDimmForProfiling()}
                    />
                    <InfoLabel
                        label={nls.localize('vuengine/editors/engineConfig/debug/dimmForProfiling', 'Dimm For Profiling')}
                        tooltip={nls.localize(
                            'vuengine/editors/engineConfig/debug/dimmForProfilingDescription',
                            'Dimm the screen to make it easier to read the profiling output.'
                        )}
                    />
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.profileStreaming ?? PROFILE_STREAMING_DEFAULT_VALUE}
                        onChange={() => toggleProfileStreaming()}
                    />

                    <InfoLabel
                        label={nls.localize('vuengine/editors/engineConfig/debug/profileStreaming', 'Profile Streaming')}
                        tooltip={nls.localize(
                            'vuengine/editors/engineConfig/debug/profileStreamingDescription',
                            "Enable streaming's profiling."
                        )}
                    />
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.showStreamingProfiling ?? SHOW_STREAMING_PROFILING_DEFAULT_VALUE}
                        onChange={() => toggleShowStreamingProfiling()}
                    />
                    <InfoLabel
                        label={nls.localize('vuengine/editors/engineConfig/debug/showStreamingProfiling', 'Show Streaming Profiling')}
                        tooltip={nls.localize(
                            'vuengine/editors/engineConfig/debug/showStreamingProfilingDescription',
                            "Show streaming's profiling during the game."
                        )}
                    />
                </label>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/engineConfig/debug/framerate', 'Framerate')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.printFramerate ?? PRINT_FRAMERATE_DEFAULT_VALUE}
                        onChange={() => togglePrintFramerate()}
                    />
                    {nls.localize('vuengine/editors/engineConfig/debug/printFramerate', 'Print Framerate')}
                </label>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/engineConfig/debug/memoryPools', 'Memory Pools')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.showMemoryPoolStatus ?? SHOW_MEMORY_POOL_STATUS_DEFAULT_VALUE}
                        onChange={() => toggleShowMemoryPoolStatus()}
                    />
                    {nls.localize('vuengine/editors/engineConfig/debug/showMemoryPoolStatus', 'Show Memory Pool Status')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.showDetailedMemoryPoolStatus ?? SHOW_DETAILED_MEMORY_POOL_STATUS_DEFAULT_VALUE}
                        onChange={() => toggleShowDetailedMemoryPoolStatus()}
                    />
                    {nls.localize('vuengine/editors/engineConfig/debug/showDetailedMemoryPoolStatus', 'Show Detailed Memory Pool Status')}
                </label>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/engineConfig/debug/stack', 'Stack')}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={data.debug?.showStackOverflowAlert ?? SHOW_STACK_OVERFLOW_ALERT_DEFAULT_VALUE}
                        onChange={() => toggleShowStackOverflowAlert()}
                    />
                    {nls.localize('vuengine/editors/engineConfig/debug/showStackOverflowAlert', 'Show Stack Overflow Alert')}
                </label>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/engineConfig/debug/headroom', 'Headroom')}
                    </label>
                    <input
                        className="theia-input"
                        style={{ width: 64 }}
                        type="number"
                        value={data.debug?.stackHeadroom ?? STACK_HEADROOM_DEFAULT_VALUE}
                        min={STACK_HEADROOM_MIN_VALUE}
                        max={STACK_HEADROOM_MAX_VALUE}
                        onChange={e => setStackHeadroom(e.target.value === '' ? STACK_HEADROOM_MIN_VALUE : parseInt(e.target.value))}
                    />
                </VContainer>
            </VContainer>
        </VContainer>
    );
}
