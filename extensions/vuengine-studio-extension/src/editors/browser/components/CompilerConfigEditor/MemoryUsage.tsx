import { nls } from '@theia/core';
import React from 'react';
import { BssMemorySection, CompilerConfigData, DataMemorySection } from './CompilerConfigEditorTypes';

interface MemoryUsageProps {
    data: CompilerConfigData
    updateData: (data: CompilerConfigData) => void
}

export default function MemoryUsage(props: MemoryUsageProps): React.JSX.Element {
    const { data, updateData } = props;

    const setMemoryUsage = (type: 'initializedData' | 'memoryPools' | 'staticSingletons' | 'uninitializedData' | 'virtualTables', memorySection: BssMemorySection) => {
        updateData({
            ...data,
            memoryUsage: {
                ...data.memoryUsage,
                [type]: memorySection,
            },
        });
    };

    const dataMemorySectionOptions = <>
        <option value={DataMemorySection.data}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/data', 'Initialized data')} ({DataMemorySection.data})
        </option>
        <option value={DataMemorySection.sdata}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/sdata', 'Small initialized data')} ({DataMemorySection.sdata})
        </option>
        <option value={DataMemorySection.dramData}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/dramData', 'Initialized data in DRAM')} ({DataMemorySection.dramData})
        </option>
        <option value={DataMemorySection.sramData}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/sramData', 'Initialized data in SRAM')} ({DataMemorySection.sramData})
        </option>
    </>;

    const bssMemorySectionOptions = <>
        <option value={BssMemorySection.bss}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/data', 'Uninitialized data')} ({BssMemorySection.bss})
        </option>
        <option value={BssMemorySection.sbss}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/sdata', 'Small uninitialized data')} ({BssMemorySection.sbss})
        </option>
        <option value={BssMemorySection.dramBss}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/dramData', 'Uninitialized data in DRAM')} ({BssMemorySection.dramBss})
        </option>
        <option value={BssMemorySection.sramBss}>
            {nls.localize('vuengine/editors/compilerConfig/memorySectionsSelect/sramData', 'Uninitialized data in SRAM')} ({BssMemorySection.sramBss})
        </option>
    </>;

    return <table>
        <tr>
            <td style={{ width: 200 }}>
                {nls.localize('vuengine/editors/compilerConfig/dataType', 'Data Type')}
            </td>
            <td>
                {nls.localize('vuengine/editors/compilerConfig/dataSection', 'Data Section')}
            </td>
        </tr>
        <tr>
            <td>
                {nls.localize('vuengine/editors/compilerConfig/initializedData', 'Initialized Global Data')}
            </td>
            <td>
                <select
                    className='theia-select'
                    style={{ width: '100%' }}
                    onChange={e => setMemoryUsage('initializedData', e.target.value as BssMemorySection)}
                    value={data.memoryUsage.initializedData}
                >
                    {dataMemorySectionOptions}
                </select>
            </td>
        </tr>
        <tr>
            <td>
                {nls.localize('vuengine/editors/compilerConfig/memoryPools', 'Memory Pools')}
            </td>
            <td>
                <select
                    className='theia-select'
                    style={{ width: '100%' }}
                    onChange={e => setMemoryUsage('memoryPools', e.target.value as BssMemorySection)}
                    value={data.memoryUsage.memoryPools}
                >
                    {bssMemorySectionOptions}
                </select>
            </td>
        </tr>
        <tr>
            <td>
                {nls.localize('vuengine/editors/compilerConfig/staticSingletons', 'Static Singletons')}
            </td>
            <td>
                <select
                    className='theia-select'
                    style={{ width: '100%' }}
                    onChange={e => setMemoryUsage('staticSingletons', e.target.value as BssMemorySection)}
                    value={data.memoryUsage.staticSingletons}
                >
                    {bssMemorySectionOptions}
                </select>
            </td>
        </tr>
        <tr>
            <td>
                {nls.localize('vuengine/editors/compilerConfig/uninitializedData', 'Uninitialized Global Data')}
            </td>
            <td>
                <select
                    className='theia-select'
                    style={{ width: '100%' }}
                    onChange={e => setMemoryUsage('uninitializedData', e.target.value as BssMemorySection)}
                    value={data.memoryUsage.uninitializedData}
                >
                    {bssMemorySectionOptions}
                </select>
            </td>
        </tr>
        <tr>
            <td>
                {nls.localize('vuengine/editors/compilerConfig/virtualTables', 'Virtual Tables')}
            </td>
            <td>
                <select
                    className='theia-select'
                    style={{ width: '100%' }}
                    onChange={e => setMemoryUsage('virtualTables', e.target.value as BssMemorySection)}
                    value={data.memoryUsage.virtualTables}
                >
                    {bssMemorySectionOptions}
                </select>
            </td>
        </tr>
    </table>;
}
