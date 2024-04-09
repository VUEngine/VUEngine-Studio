import React from 'react';
import VContainer from '../Common/VContainer';
import CompilerConfig from './CompilerConfig';
import { CompilerConfigData } from './CompilerConfigEditorTypes';
import MemorySections from './MemorySections';
import MemoryUsage from './MemoryUsage';

interface CompilerConfigEditorProps {
    data: CompilerConfigData
    updateData: (data: CompilerConfigData) => void
}

export default function CompilerConfigEditor(props: CompilerConfigEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    return <VContainer gap={15}>
        <CompilerConfig
            data={data}
            updateData={updateData}
        />
        <MemorySections
            data={data}
            updateData={updateData}
        />
        <MemoryUsage
            data={data}
            updateData={updateData}
        />
    </VContainer>;
}
