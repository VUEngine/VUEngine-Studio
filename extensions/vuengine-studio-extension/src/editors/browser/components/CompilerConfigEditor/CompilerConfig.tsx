import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { CompilerConfigData, CompilerOptimization } from './CompilerConfigEditorTypes';

interface CompilerConfigProps {
    data: CompilerConfigData
    updateData: (data: CompilerConfigData) => void
}

export default function CompilerConfig(props: CompilerConfigProps): React.JSX.Element {
    const { data, updateData } = props;

    const toggleFramePointer = () => {
        updateData({
            ...data,
            framePointer: !data.framePointer,
        });
    };

    const togglePrologFunctions = () => {
        updateData({
            ...data,
            prologFunctions: !data.prologFunctions,
        });
    };

    const setOptimization = (optimization: CompilerOptimization) => {
        updateData({
            ...data,
            optimization,
        });
    };

    return <HContainer gap={15} wrap='wrap'>
        <VContainer grow={1}>
            <label>
                {nls.localize('vuengine/editors/compilerConfig/optimization', 'Optimization')}
            </label>
            <select
                className='theia-select'
                onChange={e => setOptimization(e.target.value as CompilerOptimization)}
                value={data.optimization}
            >
                <option value={CompilerOptimization.O0}>
                    {CompilerOptimization.O0} ({nls.localize('vuengine/editors/compilerConfig/optimizationOptions/O0', 'No optimization')})
                </option>
                <option value={CompilerOptimization.O1}>
                    {CompilerOptimization.O1} ({nls.localize('vuengine/editors/compilerConfig/optimizationOptions/O1', 'Optimize minimally')})
                </option>
                <option value={CompilerOptimization.O2}>
                    {CompilerOptimization.O2} ({nls.localize('vuengine/editors/compilerConfig/optimizationOptions/O2', 'Optimize more')})
                </option>
                <option value={CompilerOptimization.O3}>
                    {CompilerOptimization.O3} ({nls.localize('vuengine/editors/compilerConfig/optimizationOptions/O3', 'Optimize even more')})
                </option>
                <option value={CompilerOptimization.Ofast}>
                    {CompilerOptimization.Ofast} ({nls.localize('vuengine/editors/compilerConfig/optimizationOptions/Ofast', 'Optimize very aggressively')})
                </option>
                <option value={CompilerOptimization.Os}>
                    {CompilerOptimization.Os} ({nls.localize('vuengine/editors/compilerConfig/optimizationOptions/Os', 'Optimize for code size')})
                </option>
            </select>
        </VContainer>
        <VContainer grow={1}>
            <label>
                {nls.localize('vuengine/editors/compilerConfig/options', 'Options')}
            </label>
            <HContainer gap={15}>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={data.framePointer}
                            onChange={toggleFramePointer}
                        />
                        {nls.localize('vuengine/editors/compilerConfig/useFramePointer', 'Use Frame Pointer')}
                    </label>
                </VContainer>
                <VContainer>
                    <label>
                        <input
                            type="checkbox"
                            checked={data.prologFunctions}
                            onChange={togglePrologFunctions}
                        />
                        {nls.localize('vuengine/editors/compilerConfig/usePrologFunctions', 'Use Prolog Functions')}
                    </label>
                </VContainer>
            </HContainer>
        </VContainer>
    </HContainer>;
}
