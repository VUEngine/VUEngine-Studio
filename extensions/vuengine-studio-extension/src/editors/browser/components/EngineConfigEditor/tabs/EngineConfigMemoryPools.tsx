import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import HoverInfo from '../../Common/HoverInfo';
import InfoLabel from '../../Common/InfoLabel';
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
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [globalVariablesTotalSize, setGlobalVariablesTotalSize] = useState<number>(0);

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

    const setWarningThreshold = (warningThreshold: number): void => {
        updateData({
            ...data,
            memoryPools: {
                ...(data.memoryPools ?? {}),
                warningThreshold,
            }
        });
    };

    const determineGlobalVariablesTotalSize = async (): Promise<void> => {
        await services.workspaceService.ready;

        const roots = services.workspaceService.tryGetRoots();
        const workspaceRootUri = roots[0].resource;

        const mapFileUri = workspaceRootUri.resolve('build').resolve('output.map');
        const mapFileExists = await services.fileService.exists(mapFileUri);
        if (!mapFileExists) {
            return;
        }

        const mapFileContent = await services.fileService.readFile(mapFileUri);
        const matches = mapFileContent.value.toString().match(/0x0000000005([a-z0-9]{6})[' ']*PROVIDE \(\_\_bssEnd,/);
        if (matches === null || matches[1] === undefined) {
            return;
        }

        const bssEndAddress = parseInt(matches[1], 16);
        const computedSize = bssEndAddress - services.vesBuildService.lastBuildTotalMemoryPoolsSize;

        setGlobalVariablesTotalSize(computedSize);
    };

    const totalPoolsSize = (data.memoryPools?.pools ?? []).reduce(
        (accumulator, pool) => accumulator + pool.size * pool.objects,
        0,
    );
    const totalMemorySize = totalPoolsSize + globalVariablesTotalSize;
    const totalMemoryUsage = Math.round(totalMemorySize * 100 / MEMORY_POOLS_TOTAL_AVAILABLE_SIZE);
    const sizeLevel = totalMemorySize >= MEMORY_POOLS_ERROR_THRESHOLD
        ? 'error'
        : totalMemorySize >= MEMORY_POOLS_WARNING_THRESHOLD
            ? 'warning'
            : 'ok';

    useEffect(() => {
        determineGlobalVariablesTotalSize();
        const listener = services.vesBuildService.onDidSucceedBuild(() => {
            determineGlobalVariablesTotalSize();
        });
        return () => listener.dispose();
    }, []);

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
                            <div style={{ width: 100 }}>
                                {nls.localize('vuengine/editors/engineConfig/memoryPools/sizeInBytes', 'Size (Bytes)')}
                            </div>
                            <div style={{ width: 100 }}>
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
                                        <Input
                                            type='number'
                                            value={pool.size}
                                            setValue={size => setMemoryPool(index, {
                                                ...pool,
                                                size: size as number,
                                            })}
                                            min={MEMORY_POOL_SIZE_MIN_VALUE}
                                            max={MEMORY_POOL_SIZE_MAX_VALUE}
                                            defaultValue={MEMORY_POOL_SIZE_DEFAULT_VALUE}
                                            step={MEMORY_POOL_SIZE_STEP}
                                            width={100}
                                            tabIndex={1000000 - pool.size}
                                            autoFocus={pool.size === MEMORY_POOL_SIZE_MIN_VALUE}
                                        />
                                        <Input
                                            type='number'
                                            value={pool.objects}
                                            setValue={objects => setMemoryPool(index, {
                                                ...pool,
                                                objects: objects as number,
                                            })}
                                            min={MEMORY_POOL_OBJECTS_MIN_VALUE}
                                            max={MEMORY_POOL_OBJECTS_MAX_VALUE}
                                            defaultValue={MEMORY_POOL_OBJECTS_DEFAULT_VALUE}
                                            tabIndex={1000000 - pool.size + 1}
                                            width={100}
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
                                        {pool.size % 4 !== 0 &&
                                            <i
                                                className="error codicon codicon-warning"
                                                title={nls.localize('vuengine/editors/engineConfig/memoryPools/sizeNotMultipleOf4', 'Size must be a multiple of 4')}
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
                    style={{ width: 244 }}
                    tabIndex={0}
                    onClick={addMemoryPool}
                    title={nls.localizeByDefault('Add')}
                >
                    <i className='codicon codicon-plus' />
                </button>
                <div>
                    <table style={{ minWidth: 244 }}>
                        <tbody>
                            <tr>
                                <td>
                                    {nls.localize('vuengine/editors/engineConfig/memoryPools/totalMemoryPoolsSize', 'Total Memory Pools Size')}:
                                </td>
                                <td align='right'>
                                    {totalPoolsSize.toLocaleString()} Byte
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {nls.localize('vuengine/editors/engineConfig/memoryPools/staticGlobalVariables', 'Static & Global Variables')}:
                                </td>
                                <td align='right'>
                                    {globalVariablesTotalSize === 0
                                        ? <HContainer>
                                            {nls.localizeByDefault('Unknown')}
                                            <HoverInfo
                                                tooltip={nls.localize(
                                                    'vuengine/editors/engineConfig/memoryPools/unknownEngineSizeDescription',
                                                    'The total size of static and global variables can only be determined after a successful build.'
                                                )}
                                            />
                                        </HContainer>
                                        : <>
                                            {globalVariablesTotalSize.toLocaleString()} Byte
                                        </>
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {nls.localize('vuengine/editors/engineConfig/memoryPools/totalUsedMemory', 'Total Used Memory')}:
                                </td>
                                <td align='right'>
                                    {totalMemorySize.toLocaleString()} Byte
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {nls.localize('vuengine/editors/engineConfig/memoryPools/totalAvailableMemory', 'Total Available Memory')}:
                                </td>
                                <td align='right'>
                                    {MEMORY_POOLS_TOTAL_AVAILABLE_SIZE.toLocaleString()} Byte
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    {nls.localize('vuengine/editors/engineConfig/memoryPools/usedMemoryPercent', 'Used Memory (Percent)')}:
                                </td>
                                <td align='right'>
                                    <span className={sizeLevel}>
                                        {sizeLevel === 'error' && <><i className="codicon codicon-error" style={{ verticalAlign: 'bottom' }} /> </>}
                                        {sizeLevel === 'warning' && <><i className="codicon codicon-warning" style={{ verticalAlign: 'bottom' }} /> </>}
                                        {totalMemoryUsage.toLocaleString()}%
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
                    <Input
                        type="number"
                        value={data.memoryPools?.warningThreshold ?? MEMORY_POOLS_WARNING_THRESHOLD_DEFAULT_VALUE}
                        setValue={setWarningThreshold}
                        min={MEMORY_POOLS_WARNING_THRESHOLD_MIN_VALUE}
                        max={MEMORY_POOLS_WARNING_THRESHOLD_MAX_VALUE}
                        defaultValue={MEMORY_POOLS_WARNING_THRESHOLD_DEFAULT_VALUE}
                        width={48}
                    />
                    %
                </HContainer>
            </VContainer>
        </VContainer>
    );
}
