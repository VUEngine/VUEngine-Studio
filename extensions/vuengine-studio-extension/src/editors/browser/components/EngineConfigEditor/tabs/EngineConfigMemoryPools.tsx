import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp, roundToNextMultipleOf4 } from '../../Common/Utils';
import {
    EngineConfigData,
    EngineConfigDataMemoryPool,
    MEMORY_POOL_OBJECTS_DEFAULT_VALUE,
    MEMORY_POOL_OBJECTS_MAX_VALUE,
    MEMORY_POOL_OBJECTS_MIN_VALUE,
    MEMORY_POOL_SIZE_DEFAULT_VALUE,
    MEMORY_POOL_SIZE_MAX_VALUE,
    MEMORY_POOL_SIZE_MIN_VALUE,
    MEMORY_POOL_SIZE_STEP,
    MEMORY_POOLS_CLEAN_UP_DEFAULT_VALUE,
    MEMORY_POOLS_ERROR_THRESHOLD,
    MEMORY_POOLS_TOTAL_AVAILABLE_SIZE,
    MEMORY_POOLS_WARNING_THRESHOLD,
    MEMORY_POOLS_WARNING_THRESHOLD_DEFAULT_VALUE,
    MEMORY_POOLS_WARNING_THRESHOLD_MAX_VALUE,
    MEMORY_POOLS_WARNING_THRESHOLD_MIN_VALUE
} from '../EngineConfigEditorTypes';

interface EngineConfigMemoryPoolsProps {
    data: EngineConfigData
    updateData: (data: EngineConfigData) => void
}

export default function EngineConfigMemoryPools(props: EngineConfigMemoryPoolsProps): React.JSX.Element {
    const { data, updateData } = props;

    const addMemoryPool = (): void => {
        updateData({
            ...data,
            memoryPools: {
                ...(data.memoryPools ?? {}),
                pools: [
                    ...(data.memoryPools?.pools ?? []),
                    {
                        objects: MEMORY_POOL_OBJECTS_DEFAULT_VALUE,
                        size: MEMORY_POOL_SIZE_DEFAULT_VALUE,
                    }
                ],
            }
        });
    };

    const removeMemoryPool = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/engineConfig/memoryPools/removeMemoryPool', 'Remove Memory Pool'),
            msg: nls.localize('vuengine/editors/engineConfig/memoryPools/areYouSureYouWantToRemoveMemoryPool', 'Are you sure you want to remove this memory pool?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updateData({
                ...data,
                memoryPools: {
                    ...(data.memoryPools ?? {}),
                    pools: [
                        ...(data.memoryPools?.pools?.slice(0, index) ?? []),
                        ...(data.memoryPools?.pools?.slice(index + 1) ?? [])
                    ],
                }
            });
        }
    };

    const setMemoryPool = async (index: number, value: EngineConfigDataMemoryPool): Promise<void> => {
        updateData({
            ...data,
            memoryPools: {
                ...(data.memoryPools ?? {}),
                pools: [
                    ...(data.memoryPools?.pools?.slice(0, index) ?? []),
                    value,
                    ...(data.memoryPools?.pools?.slice(index + 1) ?? [])
                ],
            }
        });
    };

    const toggleCleanUp = (): void => {
        updateData({
            ...data,
            memoryPools: {
                ...(data.memoryPools ?? {}),
                cleanUp: !(data.memoryPools?.cleanUp ?? MEMORY_POOLS_CLEAN_UP_DEFAULT_VALUE),
            }
        });
    };

    const setWarningThreshold = (warningThreshold: number): void => {
        updateData({
            ...data,
            memoryPools: {
                ...(data.memoryPools ?? {}),
                warningThreshold: clamp(
                    warningThreshold,
                    MEMORY_POOLS_WARNING_THRESHOLD_MIN_VALUE,
                    MEMORY_POOLS_WARNING_THRESHOLD_MAX_VALUE,
                    MEMORY_POOLS_WARNING_THRESHOLD_DEFAULT_VALUE
                ),
            }
        });
    };

    const totalPoolsSize = (data.memoryPools?.pools ?? []).reduce(
        (accumulator, pool) => accumulator + pool.size * pool.objects,
        0,
    );
    const totalPoolsUsage = Math.round(totalPoolsSize * 100 / MEMORY_POOLS_TOTAL_AVAILABLE_SIZE);
    const sizeLevel = totalPoolsSize >= MEMORY_POOLS_ERROR_THRESHOLD
        ? 'error'
        : totalPoolsSize >= MEMORY_POOLS_WARNING_THRESHOLD
            ? 'warning'
            : 'ok';

    return (
        <VContainer gap={15}>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/memoryPools/memoryPools', 'Memory Pools')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/memoryPools/memoryPoolsDescription',
                        '',
                    )}
                />
                {data.memoryPools?.pools?.length > 0
                    ? <>
                        <HContainer>
                            <div style={{ width: 110 }}>
                                {nls.localize('vuengine/editors/engineConfig/memoryPools/sizeInBytes', 'Size (Bytes)')}
                            </div>
                            <div style={{ width: 110 }}>
                                {nls.localize('vuengine/editors/engineConfig/memoryPools/blocks', 'Blocks')}
                            </div>
                        </HContainer>
                        <VContainer>
                            {
                                data.memoryPools?.pools?.map((pool, index) => (
                                    <HContainer
                                        key={index}
                                        style={{ order: 1000000 - pool.size }}
                                        alignItems="center"
                                    >
                                        <input
                                            className='theia-input'
                                            type='number'
                                            step={MEMORY_POOL_SIZE_STEP}
                                            min={MEMORY_POOL_SIZE_MIN_VALUE}
                                            max={MEMORY_POOL_SIZE_MAX_VALUE}
                                            tabIndex={1000000 - pool.size}
                                            style={{ width: 100 }}
                                            value={pool.size}
                                            autoFocus={pool.size === MEMORY_POOL_SIZE_MIN_VALUE}
                                            onChange={e => setMemoryPool(index, {
                                                ...pool,
                                                size: e.target.value === ''
                                                    ? MEMORY_POOL_SIZE_MIN_VALUE
                                                    : clamp(
                                                        roundToNextMultipleOf4(parseInt(e.target.value)),
                                                        MEMORY_POOL_SIZE_MIN_VALUE,
                                                        MEMORY_POOL_SIZE_MAX_VALUE,
                                                        MEMORY_POOL_SIZE_DEFAULT_VALUE
                                                    ),
                                            })}
                                        />
                                        <input
                                            className='theia-input'
                                            type='number'
                                            min={MEMORY_POOL_OBJECTS_MIN_VALUE}
                                            max={MEMORY_POOL_OBJECTS_MAX_VALUE}
                                            tabIndex={1000000 - pool.size + 1}
                                            style={{ width: 100 }}
                                            value={pool.objects}
                                            onChange={e => setMemoryPool(index, {
                                                ...pool,
                                                objects: e.target.value === ''
                                                    ? MEMORY_POOL_OBJECTS_MIN_VALUE
                                                    : clamp(
                                                        parseInt(e.target.value),
                                                        MEMORY_POOL_OBJECTS_MIN_VALUE,
                                                        MEMORY_POOL_OBJECTS_MAX_VALUE,
                                                        MEMORY_POOL_OBJECTS_DEFAULT_VALUE
                                                    ),
                                            })}
                                        />
                                        <button
                                            className='theia-button secondary'
                                            tabIndex={1000000 - pool.size + 2}
                                            onClick={() => removeMemoryPool(index)}
                                            title={nls.localizeByDefault('Remove')}
                                        >
                                            <i className='codicon codicon-x' />
                                        </button>
                                        {data.memoryPools?.pools?.filter(p => p.size === pool.size).length > 1 &&
                                            <i
                                                className="error codicon codicon-warning"
                                                title={nls.localize('vuengine/editors/engineConfig/memoryPools/duplicatePoolSize', 'Duplicate Pool Size')}
                                            />
                                        }
                                    </HContainer>
                                ))
                            }
                        </VContainer>
                    </>
                    : <div className="secondaryText">
                        {nls.localize('vuengine/editors/engineConfig/memoryPools/noMemoryPoolsDefined', 'No memory pools defined.')}
                    </div>}
                <button
                    className='theia-button add-button'
                    style={{ width: 262 }}
                    tabIndex={0}
                    onClick={addMemoryPool}
                    title={nls.localizeByDefault('Add')}
                >
                    <i className='codicon codicon-plus' />
                </button>

                <HContainer>
                    <div>
                        {nls.localize('vuengine/editors/engineConfig/memoryPools/totalSize', 'Total Size')}:
                    </div>
                    <div>
                        <span className={sizeLevel}>
                            {sizeLevel === 'error' && <><i className="codicon codicon-error" style={{ verticalAlign: 'bottom' }} /> </>}
                            {sizeLevel === 'warning' && <><i className="codicon codicon-warning" style={{ verticalAlign: 'bottom' }} /> </>}
                            {totalPoolsSize.toLocaleString()}
                        </span> / {MEMORY_POOLS_TOTAL_AVAILABLE_SIZE.toLocaleString()} Byte
                    </div>
                    <div>
                        ({totalPoolsUsage.toLocaleString()}%)
                    </div>
                </HContainer>
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/memoryPools/warningThreshold', 'Warning Threshold')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/memoryPools/warningThresholdDescription',
                        'Percentage above which the memory pool status shows the pool usage.',
                    )}
                />
                <HContainer alignItems="center">
                    <input
                        className="theia-input"
                        style={{ width: 48 }}
                        type="number"
                        value={data.memoryPools?.warningThreshold ?? MEMORY_POOLS_WARNING_THRESHOLD_DEFAULT_VALUE}
                        min={MEMORY_POOLS_WARNING_THRESHOLD_MIN_VALUE}
                        max={MEMORY_POOLS_WARNING_THRESHOLD_MAX_VALUE}
                        onChange={e => setWarningThreshold(e.target.value === '' ? MEMORY_POOLS_WARNING_THRESHOLD_MIN_VALUE : parseInt(e.target.value))}
                    />
                    %
                </HContainer>
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/editors/engineConfig/memoryPools/cleanUp', 'Clean Up')}
                    tooltip={nls.localize(
                        'vuengine/editors/engineConfig/memoryPools/cleanUpDescription',
                        'Enabling clean-up will reset each byte of each free block to 0 on resetting the game. Use only for debugging! \
Proper object initialization must make this macro unnecessary.',
                    )}
                />
                <input
                    type="checkbox"
                    checked={data.memoryPools?.cleanUp ?? MEMORY_POOLS_CLEAN_UP_DEFAULT_VALUE}
                    onChange={() => toggleCleanUp()}
                />
            </VContainer>
        </VContainer>
    );
}
